import json
import random
import secrets
import string
from datetime import datetime, timedelta
from django.shortcuts import render
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.core.mail import send_mail, get_connection
from django.conf import settings
from pymongo import MongoClient
import hashlib
import re

# MongoDB connection
client = MongoClient("mongodb+srv://sutgJxLaXWo7gKMR:sutgJxLaXWo7gKMR@cluster0.2ytii.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0")
db = client["Mech_GenAI"]
users_collection = db["Users"]

# SMTP settings
EMAIL_HOST = 'smtp.gmail.com'
EMAIL_PORT = 587
EMAIL_USE_TLS = True
EMAIL_HOST_USER = 'rahulsnsihub@gmail.com'
EMAIL_HOST_PASSWORD = 'gspmoernuumgcerc'
DEFAULT_FROM_EMAIL = 'rahulsnsihub@gmail.com'

# Global dictionary to store OTPs temporarily (for demonstration purposes)
otp_storage = {}
temp_user_storage = {}

def generate_verification_code():
    """Generate a 6-digit verification code."""
    return ''.join(random.choices(string.digits, k=6))

def hash_password(password):
    """Hash a password using SHA-256."""
    return hashlib.sha256(password.encode()).hexdigest()

def validate_email(email):
    """Validate email format."""
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(pattern, email) is not None

def validate_phone(phone):
    """Validate phone number format."""
    pattern = r'^\+?[0-9]{10,15}$'
    return re.match(pattern, phone) is not None

def validate_password(password):
    """
    Validate password complexity:
    - At least 8 characters
    - Contains at least one uppercase letter, one lowercase letter, and one number
    """
    if len(password) < 8:
        return False
    if not re.search(r'[A-Z]', password):
        return False
    if not re.search(r'[a-z]', password):
        return False
    if not re.search(r'[0-9]', password):
        return False
    return True

@csrf_exempt
def signup(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            name = data.get('name')
            email = data.get('email')
            phone = data.get('phone')
            password = data.get('password')

            # Input validation
            if not all([name, email, phone, password]):
                return JsonResponse({'message': 'All fields are required'}, status=400)

            if not validate_email(email):
                return JsonResponse({'message': 'Invalid email format'}, status=400)

            if not validate_phone(phone):
                return JsonResponse({'message': 'Invalid phone number format'}, status=400)

            if not validate_password(password):
                return JsonResponse({'message': 'Password must be at least 8 characters and include uppercase, lowercase, and numbers'}, status=400)

            # Check if email already exists
            if users_collection.find_one({'email': email}):
                return JsonResponse({'message': 'Email already exists'}, status=400)

            # Check if phone already exists
            if users_collection.find_one({'phone': phone}):
                return JsonResponse({'message': 'Phone number already exists'}, status=400)

            # Generate OTP
            otp = generate_verification_code()

            # Store user data and OTP temporarily
            temp_user_storage[email] = {
                'name': name,
                'email': email,
                'phone': phone,
                'password': hash_password(password),
                'otp': otp,
                'expires_at': datetime.now() + timedelta(minutes=15)  # OTP expires in 15 minutes
            }

            # Send OTP email
            email_subject = "Verify your email address"
            email_message = f"""
            Hello {name},

            Thank you for registering. To complete your account setup, please use the following OTP:

            {otp}

            This OTP will expire in 15 minutes.

            Best regards,
            The Team
            """

            connection = get_connection(
                host=EMAIL_HOST,
                port=EMAIL_PORT,
                username=EMAIL_HOST_USER,
                password=EMAIL_HOST_PASSWORD,
                use_tls=EMAIL_USE_TLS
            )

            send_mail(
                email_subject,
                email_message,
                DEFAULT_FROM_EMAIL,
                [email],
                connection=connection,
                fail_silently=False,
            )

            return JsonResponse({'message': 'OTP sent successfully! Please check your email to verify your account.'}, status=200)

        except json.JSONDecodeError:
            return JsonResponse({'message': 'Invalid JSON data'}, status=400)
        except ValueError as ve:
            return JsonResponse({'message': f'Value error: {str(ve)}'}, status=400)
        except KeyError as ke:
            return JsonResponse({'message': f'Key error: {str(ke)}'}, status=400)
        except Exception as e:
            return JsonResponse({'message': f'Internal server error: {str(e)}'}, status=500)

    return JsonResponse({'message': 'Method not allowed'}, status=405)

@csrf_exempt
def verify_email(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            email = data.get('email')
            otp = data.get('otp')

            if not email or not otp:
                return JsonResponse({'message': 'Email and OTP are required'}, status=400)

            user_data = temp_user_storage.get(email)

            if not user_data or user_data['otp'] != otp or user_data['expires_at'] < datetime.now():
                return JsonResponse({'message': 'Invalid or expired OTP'}, status=400)

            # Insert user data into the database with is_verified set to True
            users_collection.insert_one({
                'name': user_data['name'],
                'email': user_data['email'],
                'phone': user_data['phone'],
                'password': user_data['password'],
                'created_at': datetime.now(),
                'is_verified': True,
                'last_login': None
            })

            # Remove the temporary user data
            del temp_user_storage[email]

            return JsonResponse({'message': 'Email verified successfully'}, status=200)

        except json.JSONDecodeError:
            return JsonResponse({'message': 'Invalid JSON in request body'}, status=400)
        except Exception as e:
            return JsonResponse({'message': f'Internal server error: {str(e)}'}, status=500)

    return JsonResponse({'message': 'Method not allowed'}, status=405)

@csrf_exempt
def login(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            email = data.get('email')
            password = data.get('password')

            if not all([email, password]):
                return JsonResponse({'message': 'Email and password are required'}, status=400)

            # Find the user
            user = users_collection.find_one({'email': email})

            if not user:
                return JsonResponse({'message': 'Invalid email or password'}, status=401)

            # Check if user is verified
            if not user.get('is_verified', False):
                return JsonResponse({'message': 'Email not verified. Please check your email for OTP.'}, status=403)

            # Check password
            if user['password'] != hash_password(password):
                return JsonResponse({'message': 'Invalid email or password'}, status=401)

            # Update last login
            users_collection.update_one(
                {'_id': user['_id']},
                {'$set': {'last_login': datetime.now()}}
            )

            # In a real application, you'd generate and return a JWT token here
            # For simplicity, we're just returning success message
            return JsonResponse({
                'message': 'Login successful',
                'user': {
                    'name': user['name'],
                    'email': user['email'],
                    # Don't send sensitive information like password
                }
            }, status=200)

        except Exception as e:
            return JsonResponse({'message': f'Error: {str(e)}'}, status=500)

    return JsonResponse({'message': 'Method not allowed'}, status=405)

@csrf_exempt
def forgot_password(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            email = data.get('email')

            if not email:
                return JsonResponse({'message': 'Email is required'}, status=400)

            user = users_collection.find_one({'email': email})
            if not user:
                return JsonResponse({'message': 'If your email exists in our database, you will receive a verification code.'}, status=200)

            otp = generate_verification_code()
            otp_storage[email] = {
                'otp': otp,
                'otp_expires_at': datetime.now() + timedelta(minutes=15)
            }

            email_subject = "Password Reset OTP"
            email_message = f"""
            Hello {user['name']},

            Your OTP for password reset is: {otp}
            This will expire in 15 minutes.

            Best,
            Team
            """

            connection = get_connection(
                host=EMAIL_HOST,
                port=EMAIL_PORT,
                username=EMAIL_HOST_USER,
                password=EMAIL_HOST_PASSWORD,
                use_tls=EMAIL_USE_TLS
            )

            send_mail(
                email_subject,
                email_message,
                DEFAULT_FROM_EMAIL,
                [email],
                connection=connection,
                fail_silently=False,
            )

            return JsonResponse({'message': 'OTP sent to your email if it exists in our system.'}, status=200)

        except Exception as e:
            return JsonResponse({'message': f'Internal error: {str(e)}'}, status=500)

    return JsonResponse({'message': 'Method not allowed'}, status=405)


@csrf_exempt
def verify_reset_code(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            email = data.get('email')   
            otp = data.get('otp')

            if not all([email, otp]):
                return JsonResponse({'message': 'Email and OTP are required'}, status=400)

            record = otp_storage.get(email)
            if not record or record.get('otp') != otp:
                return JsonResponse({'message': 'Invalid OTP'}, status=400)

            if record.get('otp_expires_at') < datetime.now():
                del otp_storage[email]
                return JsonResponse({'message': 'OTP expired'}, status=400)

            # OTP is valid – generate token
            reset_token = secrets.token_urlsafe(32)
            otp_storage[email] = {
                'reset_token': reset_token,
                'token_expires_at': datetime.now() + timedelta(minutes=15)
            }

            return JsonResponse({'message': 'OTP verified', 'reset_token': reset_token}, status=200)

        except Exception as e:
            return JsonResponse({'message': f'Internal error: {str(e)}'}, status=500)

    return JsonResponse({'message': 'Method not allowed'}, status=405)



@csrf_exempt
def reset_password(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            email = data.get('email')
            token = data.get('token')
            new_password = data.get('new_password')

            if not all([email, token, new_password]):
                return JsonResponse({'message': 'Email, token, and new password are required'}, status=400)

            if not validate_password(new_password):
                return JsonResponse({'message': 'Password does not meet complexity requirements'}, status=400)

            record = otp_storage.get(email)
            if not record or record.get('reset_token') != token:
                return JsonResponse({'message': 'Invalid token'}, status=400)

            if record.get('token_expires_at') < datetime.now():
                del otp_storage[email]
                return JsonResponse({'message': 'Token expired'}, status=400)

            # All checks passed
            users_collection.update_one(
                {'email': email},
                {'$set': {'password': hash_password(new_password)}}
            )

            del otp_storage[email]

            return JsonResponse({'message': 'Password reset successful'}, status=200)

        except Exception as e:
            return JsonResponse({'message': f'Internal error: {str(e)}'}, status=500)

    return JsonResponse({'message': 'Method not allowed'}, status=405)


@csrf_exempt
def change_password(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            email = data.get('email')
            current_password = data.get('current_password')
            new_password = data.get('new_password')

            if not all([email, current_password, new_password]):
                return JsonResponse({'message': 'Email, current password, and new password are required'}, status=400)

            # Find the user
            user = users_collection.find_one({'email': email})

            if not user:
                return JsonResponse({'message': 'User not found'}, status=404)

            # Check current password
            if user['password'] != hash_password(current_password):
                return JsonResponse({'message': 'Current password is incorrect'}, status=401)

            # Validate new password
            if not validate_password(new_password):
                return JsonResponse({'message': 'New password must be at least 8 characters and include uppercase, lowercase, and numbers'}, status=400)

            # Update password
            users_collection.update_one(
                {'_id': user['_id']},
                {'$set': {'password': hash_password(new_password)}}
            )

            return JsonResponse({'message': 'Password changed successfully'}, status=200)

        except Exception as e:
            return JsonResponse({'message': f'Error: {str(e)}'}, status=500)

    return JsonResponse({'message': 'Method not allowed'}, status=405)
