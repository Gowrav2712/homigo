from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync

from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
import json

def send_notification(notification):
    try:
        channel_layer = get_channel_layer()
        if not channel_layer:
            print("Channel layer not available")
            return
        
        # Determine the group name based on specific recipient type
        if notification.recipient_provider_id and not notification.recipient_client_id:
            group_name = f'notifications_{notification.recipient_provider_id}'
        elif notification.recipient_client_id and not notification.recipient_provider_id:
            group_name = f'notifications_{notification.recipient_client_id}'
        elif notification.recipient_provider_id:
            group_name = f'notifications_{notification.recipient_provider_id}'
        elif notification.recipient_client_id:
            group_name = f'notifications_{notification.recipient_client_id}'
        else:
            print("No recipient found for notification")
            return
            
        print(f"Sending to notification group: {group_name}")
        
        # Ensure all data is JSON serializable
        notification_data = {
            'id': str(notification.id),
            'message': str(notification.message),
            'created_at': notification.created_at.isoformat(),
            'notification_type': str(notification.notification_type),
            'is_read': bool(notification.is_read),
            'order_id': str(notification.order_id) if notification.order_id else None,
        }
        
        print(f"Sending notification data: {notification_data}")
        
        async_to_sync(channel_layer.group_send)(
            group_name,
            {
                'type': 'notification_message',
                'message': notification_data
            }
        )
        print("Successfully sent to channel layer")
    except Exception as e:
        print(f"Notification send error: {str(e)}")