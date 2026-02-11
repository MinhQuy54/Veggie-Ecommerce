from django.shortcuts import render,redirect
from django.http import Http404
from .models import *
from .serializers import *
from rest_framework import status
from rest_framework.decorators import APIView
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate

import uuid
from django.core.mail import send_mail
from django.conf import settings
# Create your views here.

class CateogoryList(APIView):
    def get(self, requets):
        category = Category.objects.all()
        serializer = CategorySerializer(category, many=True)
        return Response(serializer.data)
    
class ProductList(APIView):
    def get(self, requets):
        category_id = requets.query_params.get('category_id')
        if category_id:
            products = Product.objects.filter(category_id=category_id)
        else:
            products = Product.objects.all()
        serializer = ProductSerializer(products, many=True)
        return Response(serializer.data)

class ProductImageList(APIView):
    def get(self, requets):
        product_img = ProductImage.objects.all()
        serializer = ProductImageSerializer(product_img, many=True)
        return Response(serializer.data)

class LoginView(APIView):
    def post(self, request):
        identifier = request.data.get('username')  # email hoặc username
        password = request.data.get('password')

        if not identifier or not password:
            return Response(
                {"detail": "Thiếu thông tin đăng nhập"},
                status=status.HTTP_400_BAD_REQUEST
            )

        user = authenticate(
            request,
            username=identifier,
            password=password
        )

        if not user:
            return Response(
                {"non_field_error": ["Sai tài khoản hoặc mật khẩu"]},
                status=status.HTTP_400_BAD_REQUEST
            )

        refresh = RefreshToken.for_user(user)

        return Response({
            "access": str(refresh.access_token),
            "refresh": str(refresh),
            "username": user.username,
            "email": user.email,
        }, status=status.HTTP_200_OK)
    
class RegisterView(APIView):
    def post(self, request):
        first_name = request.data.get('fname')
        last_name = request.data.get('lname')
        email = request.data.get('email')
        password = request.data.get('password')

        if User.objects.filter(email=email).exists():
            return Response(
                {"error": "Email đã tồn tại"},
                status=status.HTTP_400_BAD_REQUEST
            )

        activation_token = str(uuid.uuid4())

        user = User.objects.create_user(
            username=email,
            email=email,
            password=password,
            first_name=first_name,
            last_name=last_name,
            is_active=False   # CHƯA KÍCH HOẠT
        )

        user.activation_token = activation_token
        user.save()

        activation_link = f"http://localhost:8000/api/auth/activate/{activation_token}/"

        send_mail(
            subject="Kích hoạt tài khoản Veggie",
            message=f"Nhấn vào link để kích hoạt tài khoản:\n{activation_link}",
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[email],
            fail_silently=False
        )

        return Response(
            {"message": "Đăng ký thành công. Vui lòng kiểm tra email để kích hoạt tài khoản"},
            status=status.HTTP_201_CREATED
        )

class ActivateAccountView(APIView):
    def get(self, request, token):
        user = User.objects.filter(activation_token=token).first()

        if not user:
            return redirect(
                "http://localhost:5500/frontend/login.html?activated=error"
            )

        user.is_active = True
        user.activation_token = None
        user.save()

        return redirect(
            "http://localhost:5500/frontend/login.html?activated=success"
        )
    
class RequestResetPasswordView(APIView):
    def post(self, request):
        email = request.data.get('email')

        if not email:
            return Response(
                {"error": "Vui lòng nhập email"},
                status=status.HTTP_400_BAD_REQUEST
            )
        user = User.objects.filter(email=email).first()

        if not user:
            return Response(
                {"error": "Email không tồn tại"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        token = str(uuid.uuid4())
        user.reset_token = token
        user.save()

        reset_link = f"http://localhost:5500/frontend/resetpass.html?token={token}"

        send_mail(
            subject="Reset mật khẩu Veggie",
            message=f"Nhấn vào link để đặt lại mật khẩu:\n{reset_link}",
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[email],
        )
        return Response(
            {"message": "Đã gửi email reset mật khẩu"},
            status=status.HTTP_200_OK
        )
    
class ResetPasswordConfirmView(APIView):
    def post(self, request):
        token = request.data.get('token')
        password = request.data.get('password')
        confirm_password = request.data.get('confirm_password')

        if not token or not password or not confirm_password:
            return Response(
                {"error": "Thiếu dữ liệu"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if password != confirm_password:
            return Response(
                {"error": "Mật khẩu không khớp"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        user = User.objects.filter(reset_token=token).first()
        if not user:
            return Response(
                {"error": "Token không hợp lệ hoặc đã hết hạn"},
                status=status.HTTP_400_BAD_REQUEST
            )

        user.set_password(password)
        user.reset_token = None
        user.save()

        return Response(
            {"message": "Đổi mật khẩu thành công"},
            status=status.HTTP_200_OK)
