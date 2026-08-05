import time
import random
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from django.core.mail import send_mail
from django.conf import settings
from django.contrib.auth.hashers import make_password
from client.models import Client
from service_provider.models import ServiceProvider

# In-memory storage for reset OTP codes
# Format: { "user@gmail.com": { "code": "123456", "expires_at": timestamp } }
RESET_OTP_STORE = {}

class SendResetCodeView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get('email', '').strip().lower()
        if not email:
            return Response({'error': 'Please enter your email address.'}, status=status.HTTP_400_BAD_REQUEST)

        # Check if email exists in Client or ServiceProvider database
        client_exists = Client.objects.filter(email__iexact=email).exists()
        provider_exists = ServiceProvider.objects.filter(email__iexact=email).exists()

        if not client_exists and not provider_exists:
            return Response(
                {'error': 'This email address is not registered in our system.'},
                status=status.HTTP_404_NOT_FOUND
            )

        # Generate 6-digit OTP code
        otp_code = str(random.randint(100000, 999999))
        RESET_OTP_STORE[email] = {
            'code': otp_code,
            'expires_at': time.time() + 600  # Valid for 10 minutes
        }

        # Send email asynchronously via background thread for instant API response
        subject = "Homigo - Password Reset Verification Code"
        message = (
            f"Hello,\n\n"
            f"Your verification code to reset your Homigo account password is:\n\n"
            f"   {otp_code}\n\n"
            f"This code will expire in 10 minutes.\n\n"
            f"If you did not request a password reset, please ignore this email.\n\n"
            f"Best regards,\n"
            f"Homigo Team"
        )
        from_email = getattr(settings, 'DEFAULT_FROM_EMAIL', 'Homigo <homigo24@gmail.com>')
        
        def _send_email():
            try:
                send_mail(
                    subject=subject,
                    message=message,
                    from_email=from_email,
                    recipient_list=[email],
                    fail_silently=True
                )
            except Exception as e:
                print("Email sending error:", e)

        import threading
        threading.Thread(target=_send_email, daemon=True).start()

        return Response({'message': 'Verification code sent to your registered Gmail address.'}, status=status.HTTP_200_OK)


class VerifyResetCodeView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get('email', '').strip().lower()
        code = str(request.data.get('code', '')).strip()

        if not email or not code:
            return Response({'error': 'Email and verification code are required.'}, status=status.HTTP_400_BAD_REQUEST)

        record = RESET_OTP_STORE.get(email)
        if not record:
            return Response({'error': 'No verification code was requested for this email.'}, status=status.HTTP_400_BAD_REQUEST)

        if time.time() > record['expires_at']:
            RESET_OTP_STORE.pop(email, None)
            return Response({'error': 'Verification code has expired. Please request a new code.'}, status=status.HTTP_400_BAD_REQUEST)

        if record['code'] != code:
            return Response({'error': 'Invalid verification code. Please check your email and try again.'}, status=status.HTTP_400_BAD_REQUEST)

        return Response({'message': 'Verification code confirmed successfully.'}, status=status.HTTP_200_OK)


class ResetPasswordConfirmView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get('email', '').strip().lower()
        code = str(request.data.get('code', '')).strip()
        new_password = request.data.get('new_password', '').strip()

        if not email or not code or not new_password:
            return Response({'error': 'Email, verification code, and new password are required.'}, status=status.HTTP_400_BAD_REQUEST)

        if len(new_password) < 5:
            return Response({'error': 'Password must be at least 5 characters long.'}, status=status.HTTP_400_BAD_REQUEST)

        record = RESET_OTP_STORE.get(email)
        if not record or record['code'] != code or time.time() > record['expires_at']:
            return Response({'error': 'Invalid or expired verification code.'}, status=status.HTTP_400_BAD_REQUEST)

        hashed_pwd = make_password(new_password)
        updated = False

        # Update client password if exists
        clients = Client.objects.filter(email__iexact=email)
        for client in clients:
            client.password = hashed_pwd
            client.save()
            updated = True

        # Update service provider password if exists
        providers = ServiceProvider.objects.filter(email__iexact=email)
        for provider in providers:
            provider.password = hashed_pwd
            provider.save()
            updated = True

        if updated:
            RESET_OTP_STORE.pop(email, None)
            return Response({'message': 'Password updated successfully. You can now log in with your new password.'}, status=status.HTTP_200_OK)
        else:
            return Response({'error': 'Account not found.'}, status=status.HTTP_404_NOT_FOUND)
