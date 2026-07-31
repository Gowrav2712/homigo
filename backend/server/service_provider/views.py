# Django imports
from django.conf import settings
from django.core.exceptions import ValidationError
from django.http import Http404
from django.shortcuts import get_object_or_404
from django.views.decorators.csrf import csrf_exempt

# Third-party imports
import os
try:
    import cv2
    import numpy as np
    from PIL import Image
    from deepface import DeepFace
except ImportError:
    cv2 = None
    np = None
    Image = None
    DeepFace = None


# DRF imports
from rest_framework import viewsets, status
from rest_framework.decorators import action, api_view, parser_classes, permission_classes
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.permissions import AllowAny
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.viewsets import ReadOnlyModelViewSet


# Models
from .models import ServiceProvider, ProviderService, SubService

# Serializers
from .serializers import (
    ServiceProviderListSerializer,
    ServiceProviderDetailSerializer,
    ServiceProviderCreateUpdateSerializer,
    ProviderServiceSerializer,
    ProviderServiceCreateSerializer,
    LoginSerializer,
    SimpleProviderServiceSerializer
)

# Pagination
from server.pagination import CustomPagination

# Database
from django.db import transaction


import copy
from math import radians, cos, sin, asin, sqrt

def haversine_distance(lat1, lon1, lat2, lon2):
    """
    Calculate the great circle distance between two points 
    on the earth (specified in decimal degrees)
    """
    # Convert decimal degrees to radians
    lat1, lon1, lat2, lon2 = map(radians, [float(lat1), float(lon1), float(lat2), float(lon2)])

    # Haversine formula
    dlat = lat2 - lat1
    dlon = lon2 - lon1
    a = sin(dlat/2)**2 + cos(lat1) * cos(lat2) * sin(dlon/2)**2
    c = 2 * asin(sqrt(a))
    # Radius of earth in kilometers
    r = 6371
    return c * r





class ServiceProviderViewSet(viewsets.ModelViewSet):
    queryset = ServiceProvider.objects.all()
    pagination_class = CustomPagination
    lookup_field = 'id'

    def get_serializer_class(self):
        if self.action == 'list':
            return ServiceProviderListSerializer
        elif self.action in ['create', 'update', 'partial_update']:
            return ServiceProviderCreateUpdateSerializer
        return ServiceProviderDetailSerializer

    @action(detail=True, methods=['get'])
    def services(self, request, id=None):
        try:
            provider = self.get_object()
            if isinstance(provider, Response):
                return provider
                
            provider_services = provider.provider_services.all()
            serializer = ProviderServiceSerializer(provider_services, many=True)
            return Response({
                'status': True,
                'message': 'Provider services retrieved successfully',
                'data': serializer.data
            })
        except Exception as e:
            return Response({
                'status': False,
                'message': str(e),
                'data': None
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=True, methods=['post'])
    def add_services(self, request, id=None):
        try:
            provider = self.get_object()
            if isinstance(provider, Response):
                return provider

            services_data = request.data.get('services', [])
            if not isinstance(services_data, list):
                return Response({
                    'status': False,
                    'message': 'Services data must be an array',
                    'data': None
                }, status=status.HTTP_400_BAD_REQUEST)

            created_services = []
            errors = []

            with transaction.atomic():
                for service_data in services_data:
                    try:
                        # Validate that the sub-service belongs to provider's main service
                        sub_service = get_object_or_404(
                            SubService, 
                            id=service_data.get('sub_service')
                        )
                        
                        if sub_service.main_service != provider.main_service:
                            errors.append({
                                'sub_service': service_data.get('sub_service'),
                                'error': 'Sub-service must belong to provider\'s main service category'
                            })
                            continue

                        # Check if service already exists
                        if ProviderService.objects.filter(
                            provider=provider,
                            sub_service=sub_service
                        ).exists():
                            errors.append({
                                'sub_service': service_data.get('sub_service'),
                                'error': 'Service already exists for this provider'
                            })
                            continue

                        serializer = ProviderServiceCreateSerializer(
                            data=service_data,
                            context={'provider': provider}
                        )
                        serializer.is_valid(raise_exception=True)
                        provider_service = serializer.save(provider=provider)
                        created_services.append(provider_service)

                    except Exception as e:
                        errors.append({
                            'sub_service': service_data.get('sub_service'),
                            'error': str(e)
                        })

            if not created_services and errors:
                return Response({
                    'status': False,
                    'message': 'No services were added',
                    'errors': errors,
                    'data': None
                }, status=status.HTTP_400_BAD_REQUEST)

            response_serializer = ProviderServiceSerializer(created_services, many=True)
            return Response({
                'status': True,
                'message': f'{len(created_services)} services added successfully',
                'errors': errors if errors else None,
                'data': response_serializer.data
            }, status=status.HTTP_201_CREATED)

        except Exception as e:
            return Response({
                'status': False,
                'message': str(e),
                'data': None
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=True, methods=['post'])
    def remove_services(self, request, id=None):
        try:
            provider = self.get_object()
            if isinstance(provider, Response):
                return provider

            service_ids = request.data.get('service_ids', [])
            if not isinstance(service_ids, list):
                return Response({
                    'status': False,
                    'message': 'Service IDs must be an array',
                    'data': None
                }, status=status.HTTP_400_BAD_REQUEST)

            deleted_count = 0
            errors = []

            with transaction.atomic():
                for service_id in service_ids:
                    try:
                        service = ProviderService.objects.get(
                            provider=provider,
                            id=service_id
                        )
                        service.delete()
                        deleted_count += 1
                    except ProviderService.DoesNotExist:
                        errors.append({
                            'service_id': service_id,
                            'error': 'Service not found'
                        })

            if not deleted_count and errors:
                return Response({
                    'status': False,
                    'message': 'No services were deleted',
                    'errors': errors,
                    'data': None
                }, status=status.HTTP_400_BAD_REQUEST)

            return Response({
                'status': True,
                'message': f'{deleted_count} services removed successfully',
                'errors': errors if errors else None,
                'data': {
                    'deleted_count': deleted_count,
                    'service_ids': service_ids
                }
            })

        except Exception as e:
            return Response({
                'status': False,
                'message': str(e),
                'data': None
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            
            
class SignupView(APIView):
    """View for service provider signup."""
    permission_classes = [AllowAny]
    
    def post(self, request):
        # print(request.data)
        serializer = ServiceProviderCreateUpdateSerializer(data=request.data)
        if serializer.is_valid():
            provider = serializer.save()
            
            # Generate tokens
            refresh = RefreshToken.for_user(provider)
            
            return Response({
                'status': True,
                'message': 'Service provider registered successfully',
                'data': {
                    'access_token': str(refresh.access_token),
                    'refresh_token': str(refresh),
                    'provider_id': str(provider.id),
                    'email': provider.email,
                    'name': provider.full_name
                }
            }, status=status.HTTP_201_CREATED)
            
        return Response({
            'status': False,
            'message': 'Registration failed',
            'errors': serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)

class LoginView(APIView):
    """View for service provider login."""
    permission_classes = [AllowAny]
    
    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        
        if serializer.is_valid():
            provider = serializer.validated_data['user']
            refresh = RefreshToken.for_user(provider)
            
            return Response({
                'status': True,
                'message': 'Login successful',
                'data': {
                    'access_token': str(refresh.access_token),
                    'refresh_token': str(refresh),
                    'provider_id': str(provider.id),
                    'email': provider.email,
                    'name': provider.full_name,
                    'service_id':provider.main_service.id
                }
            }, status=status.HTTP_200_OK)
            
        return Response({
            'status': False,
            'message': 'Login failed',
            'errors': serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)

        
        
class ProviderServicesViewSet(ReadOnlyModelViewSet):
    permission_classes = [AllowAny]
    
    def get_serializer_class(self):
        # If provider_id is in query params, use simple serializer
        if self.request.query_params.get('provider_id'):
            return SimpleProviderServiceSerializer
        # Otherwise use the detailed serializer
        return ProviderServiceSerializer
    
    def get_queryset(self):
        provider_id = self.request.query_params.get('provider_id')
        subservice_id = self.kwargs.get('subservice_id')
        
        queryset = ProviderService.objects.select_related('provider', 'sub_service')
        
        if provider_id:
            return queryset.filter(provider_id=provider_id)
        elif subservice_id:
            return queryset.filter(sub_service_id=subservice_id)
            
        return queryset.none()  # Return empty queryset if no filter provided



class SubServiceProvidersViewSet(ReadOnlyModelViewSet):
    serializer_class = ProviderServiceSerializer
    permission_classes = [AllowAny]
   
    def list(self, request, *args, **kwargs):
        subservice_id = self.kwargs.get('subservice_id')
        lat_param = self.request.query_params.get('latitude')
        lon_param = self.request.query_params.get('longitude')
        
        try:
            client_lat = float(lat_param) if lat_param is not None else 12.2799972
            client_lon = float(lon_param) if lon_param is not None else 76.6520893
        except (ValueError, TypeError):
            client_lat = 12.2799972
            client_lon = 76.6520893

        try:
            radius = float(self.request.query_params.get('radius', 10000))
        except (ValueError, TypeError):
            radius = 10000.0
       
        # Get base queryset with provider information
        queryset = ProviderService.objects.filter(
            sub_service_id=subservice_id
        ).select_related('provider')
       
        # Calculate distances and filter
        provider_services_with_distance = []
        for provider_service in queryset:
            provider = provider_service.provider
            try:
                prov_lat = float(provider.latitude) if provider.latitude is not None else 12.2799972
                prov_lon = float(provider.longitude) if provider.longitude is not None else 76.6520893
            except (ValueError, TypeError):
                prov_lat = 12.2799972
                prov_lon = 76.6520893

            distance = haversine_distance(
                client_lat, client_lon,
                prov_lat,
                prov_lon
            )
            # Create a new object or modify existing one to ensure distance is properly set
            provider_service = copy.copy(provider_service)  # Create a shallow copy
            setattr(provider_service, 'distance', round(distance, 2))  # Set distance as an attribute
            provider_services_with_distance.append(provider_service)
       
        # Sort by distance
        provider_services_with_distance.sort(key=lambda x: x.distance)
       
        # Serialize and return the data
        serializer = self.get_serializer(provider_services_with_distance, many=True)
        return Response(serializer.data)


class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        if serializer.is_valid():
            provider = serializer.validated_data['user']
            refresh = RefreshToken.for_user(provider)
            return Response({
                'status': True,
                'message': 'Login successful',
                'data': {
                    'access_token': str(refresh.access_token),
                    'refresh_token': str(refresh),
                    'provider_id': str(provider.id),
                    'name': f"{provider.first_name} {provider.last_name}",
                    'email': provider.email,
                    'service_id': str(provider.main_service_id) if provider.main_service_id else None
                }
            }, status=status.HTTP_200_OK)
        return Response({
            'status': False,
            'errors': serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)


class SignupView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = ServiceProviderCreateUpdateSerializer(data=request.data)
        if serializer.is_valid():
            provider = serializer.save()
            refresh = RefreshToken.for_user(provider)
            return Response({
                'status': True,
                'message': 'Registration successful',
                'data': {
                    'access_token': str(refresh.access_token),
                    'refresh_token': str(refresh),
                    'provider_id': str(provider.id),
                    'name': f"{provider.first_name} {provider.last_name}",
                    'email': provider.email,
                    'service_id': str(provider.main_service_id) if provider.main_service_id else None
                }
            }, status=status.HTTP_201_CREATED)
        return Response({
            'status': False,
            'errors': serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)

        
        
