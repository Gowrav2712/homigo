from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from django.shortcuts import get_object_or_404
from .models import Orders, OrderStatus
from .serializers import OrderSerializer
from notifications.kafka_producer import NotificationProducer
from notifications.models import NotificationType,Notification
from notifications.utils import send_notification

class OrderCreateListView(APIView):
    permission_classes = [AllowAny]  
    
    def get(self, request):
        # Filter by client_id
        client_id = request.query_params.get('client_id')
        print(client_id)
        if client_id:
            orders = Orders.objects.filter(user_id=client_id).select_related(
                'provider', 'service', 'user'
            ).prefetch_related(
                'items__provider_service__sub_service', 'status_history'
            )
            serializer = OrderSerializer(orders, many=True)
            return Response(serializer.data)
            
        # Filter by provider_id
        provider_id = request.query_params.get('provider_id')
        print(provider_id)
        if provider_id:
            orders = Orders.objects.filter(provider_id=provider_id).select_related(
                'provider', 'service', 'user'
            ).prefetch_related(
                'items__provider_service__sub_service', 'status_history'
            )
            serializer = OrderSerializer(orders, many=True)
            return Response(serializer.data)
        
        return Response(
            {'error': 'Either client_id or provider_id query parameter is required'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    def post(self, request):
        serializer = OrderSerializer(data=request.data)
        if serializer.is_valid():
            order = serializer.save()
            
            provider_id = order.provider.id
            try:
                # Target ONLY the assigned service provider for new order alerts
                notification = Notification.objects.create(
                    recipient_client=None,
                    recipient_provider_id=provider_id,
                    notification_type=NotificationType.NEW_ORDER,
                    message=f"New order received from {order.user.name} for {order.service.name}",
                    order_id=order.id
                )
                send_notification(notification)
            except Exception as e:
                print(f"Error creating notification: {str(e)}")
            
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class OrderStatusUpdateView(APIView):
    permission_classes = [AllowAny]
    
    def patch(self, request, order_id):
        order = get_object_or_404(Orders, id=order_id)
        new_status = request.data.get('status')
        
        # Validate status transition
        valid_transitions = {
            OrderStatus.PENDING: [OrderStatus.ACCEPTED, OrderStatus.REJECTED, OrderStatus.CANCELLED],
            OrderStatus.ACCEPTED: [OrderStatus.COMPLETED, OrderStatus.CANCELLED, OrderStatus.REJECTED],
            OrderStatus.COMPLETED: [], # No further transitions allowed
            OrderStatus.CANCELLED: [], # No further transitions allowed
            OrderStatus.REJECTED: [] # No further transitions allowed
        }
        
        if new_status not in valid_transitions.get(order.status, []):
            return Response(
                {'error': 'Invalid status transition'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Update order status and create history entry
        old_status = order.status
        order.status = new_status
        order.save()
        
        # Create status history entry
        order.status_history.create(status=new_status)
        
        # Send targeted notifications based on status change
        notification_type = None
        message = ""
        recipient_client = None
        recipient_provider = None
        
        if new_status == OrderStatus.ACCEPTED:
            notification_type = NotificationType.ORDER_ACCEPTED
            message = f"Your {order.service.name} order has been accepted by {order.provider.full_name}."
            recipient_client = order.user
        elif new_status == OrderStatus.REJECTED:
            notification_type = NotificationType.ORDER_REJECTED
            message = f"Your {order.service.name} order has been rejected by {order.provider.full_name}."
            recipient_client = order.user
        elif new_status == OrderStatus.COMPLETED:
            notification_type = NotificationType.ORDER_COMPLETED
            message = f"Your {order.service.name} order with {order.provider.full_name} has been marked as completed."
            recipient_client = order.user
        elif new_status == OrderStatus.CANCELLED:
            notification_type = NotificationType.ORDER_CANCELLED
            message = f"Order for {order.service.name} has been cancelled by {order.user.name}."
            recipient_provider = order.provider

        if notification_type:
            notification = Notification.objects.create(
                recipient_client=recipient_client,
                recipient_provider=recipient_provider,
                notification_type=notification_type,
                message=message,
                order_id=order.id
            )
            send_notification(notification)
        
        serializer = OrderSerializer(order)
        return Response(serializer.data)
    
class OrderReviewUpdateView(APIView):
    permission_classes = [AllowAny]
    
    def patch(self, request, order_id):
        order = get_object_or_404(Orders, id=order_id)
        
        # Check if order is completed
        if order.status != OrderStatus.COMPLETED:
            return Response(
                {'error': 'Only completed orders can be reviewed'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check if review already exists
        if order.rating and order.review:
            return Response(
                {'error': 'Review already submitted for this order'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Validate rating
        rating = request.data.get('rating')
        review = request.data.get('review')
        
        if not rating or not review:
            return Response(
                {'error': 'Both rating and review are required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Update order with review and rating
        order.rating = rating
        order.review = review
        order.save()
        
        serializer = OrderSerializer(order)
        return Response(serializer.data)