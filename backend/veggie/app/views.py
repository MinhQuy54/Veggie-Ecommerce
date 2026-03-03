from django.shortcuts import render,redirect,get_object_or_404
from django.http import Http404
from .models import *
from .serializers import *
from rest_framework import status
from rest_framework.decorators import APIView
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.permissions import IsAuthenticated
from django.contrib.auth import authenticate

import uuid
from django.core.mail import send_mail
from django.conf import settings

# pagination
from .pagination import ProductPagination

# Create your views here.

class CateogoryList(APIView):
    def get(self, requets):
        category = Category.objects.all()
        serializer = CategorySerializer(category, many=True)
        return Response(serializer.data)
    
class ProductList(APIView):
    def get(self, request):
        category_id = request.query_params.get('category_id')
        min_price = request.query_params.get('min_price')
        max_price = request.query_params.get('max_price')
        ordering = request.query_params.get('ordering')
        products = Product.objects.all()

        if category_id:
            products = products.filter(category_id=category_id)

        if min_price:
            try:
                products = products.filter(price__gte=float(min_price))
            except ValueError:
                pass
        if max_price:
            try:
                products = products.filter(price__lte=float(max_price))
            except ValueError:
                pass

        if ordering:
            if ordering in ['price', '-price']:
                products = products.order_by(ordering)

        paginator = ProductPagination()
        paginated_products = paginator.paginate_queryset(products, request)
        serializer = ProductSerializer(paginated_products, many=True)
        
        # return Response(serializer.data)
        return paginator.get_paginated_response(serializer.data)
    

class ProductDetail(APIView):
    def get_obj(self,pk):
        try:
            return Product.objects.get(pk=pk)
        except Product.DoesNotExist:
            raise Http404()
    def get(self, request, pk):
        product = self.get_obj(pk)
        serializer = ProductSerializer(product)
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

class UserList(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request):
        serializer = UserSerializer(request.user)
        if serializer:
            return Response(serializer.data, status=status.HTTP_200_OK)
        
    
class UserDetail(APIView):
    permission_classes = [IsAuthenticated]
    def put(self, request):
        user = request.user
        current_password = request.data.get('current_password')
        new_password = request.data.get('new_password')
        
        if current_password and new_password:
            if not user.check_password(current_password):
                return Response({"error": "Mật khẩu hiện tại không chính xác"}, status=status.HTTP_400_BAD_REQUEST)
            user.set_password(new_password)
            user.save()
        serializer = UserSerializer(user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    # def get_obj(self, request, pk):
    #     try:
    #         return User.objects.get(pk=pk)
    #     except User.DoesNotExist:
    #         raise Http404()
        
    # def put(self, request, pk):
    #     user = self.get_obj(pk=pk)
    #     serializer = UserSerializer(user, data=request.data)
    #     if serializer.is_valid():
    #         serializer.save()
    #         return Response(serializer.data)
    #     return Response(serializer.errors,status=status.HTTP_400_BAD_REQUEST)


class AddressList(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request):
        address = ShippingAddress.objects.filter(user=request.user)
        serializer = ShippingAddressSerializer(address,many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
    def post(self, request):
        serializer = ShippingAddressSerializer(data=request.data)

        if serializer.is_valid():
            serializer.save(user=request.user)
            return Response(serializer.data, status=status.HTTP_200_OK)   
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)    
    
class AddressDetail(APIView):
    permission_classes = [IsAuthenticated]
    def get_obj(self, pk):
        try:
            return ShippingAddress.objects.get(pk=pk)
        except ShippingAddress.DoesNotExist:
            raise Http404()
    def get(self, request, pk):
        address = self.get_obj(pk)
        serializer = ShippingAddressSerializer(address)
        return Response(serializer.data)
    def put(self, request,pk):
        address = self.get_obj(pk)
        serializer = ShippingAddressSerializer(address,data=request.data)

        if serializer.is_valid():
            serializer.save(user=request.user)
            return Response(serializer.data)
        return Response(serializer.errors,status=status.HTTP_400_BAD_REQUEST)
    
    def delete(self, requst,pk):
        address = self.get_obj(pk)
        address.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
    

class CartList(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request):
        cart = CartItem.objects.filter(user=request.user)
        serializer = CartSerializer(cart, many=True)
        return Response(serializer.data)
    
    # def post(self, request):
    #     serializer = CartSerializer(data=request.data)

    #     if serializer.is_valid():
    #         serializer.save(user=request.user)
    #         return Response(serializer.data, status=status.HTTP_200_OK)
    #     return Response(status=status.HTTP_400_BAD_REQUEST)
    def post(self, request):
        product_id = request.data.get('product_id')
        quantity = request.data.get('quantity',1)
        product = get_object_or_404(Product, id=product_id)

        if product.stock < 1:
            return Response(
                {"error" : "Het hang"}, status=status.HTTP_400_BAD_REQUEST)
        
        if quantity > product.stock:
            return Response(
                {"error": f"Chỉ còn {product.stock} sản phẩm trong kho"},
                 status=status.HTTP_400_BAD_REQUEST)
        

        cart_item, created = CartItem.objects.get_or_create(
            user = request.user,
            product_id = product_id,
            defaults={'quantity': quantity}
        )

        if not created:
            new_quantity = cart_item.quantity + int(quantity)

            if new_quantity > product.stock:
                return Response(
                {"error": f"Bạn chỉ có thể mua tối đa {product.stock} sản phẩm"},
                status=status.HTTP_400_BAD_REQUEST
            )
            cart_item.quantity = new_quantity
            cart_item.save()

        serializer = CartSerializer(cart_item)
        return Response(serializer.data, status=status.HTTP_200_OK)

class CartDetail(APIView):
    def get_obj(self, pk):
        try:
            return CartItem.objects.get(pk=pk)
        except CartItem.DoesNotExist:
            raise Http404()
    
    def get(self, request, pk):
        item = self.get_obj(pk)
        serializer = CartSerializer(item)
        return Response(serializer.data)
    
    def delete(self, request,pk):
        item = self.get_obj(pk)
        item.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)



class WishList(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request):
        wishes = Wishlist.objects.filter(user=request.user)
        product_ids = wishes.values_list("product_id", flat=True)
        return Response(list(product_ids))
    
    def post(self, request):
        serializer = WishListSerializer(data=request.data)

        if serializer.is_valid():
            serializer.save(user=request.user)
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(status=status.HTTP_400_BAD_REQUEST)

class WishDetail(APIView):
    permission_classes = [IsAuthenticated]
    def get_obj(self, pk):
        try:
            return Wishlist.objects.get(pk=pk)
        except Wishlist.DoesNotExist:
            raise Http404()
    def get(self, request, pk):
        wish = self.get_obj(pk)
        serializer = WishListSerializer(wish)
        return Response(serializer.data)

    def delete(self, requst,pk):
        wish = self.get_obj(pk)
        wish.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

class WishToggle(APIView):
    permission_classes = [IsAuthenticated]
    def post(self, request):
        product_id = request.data.get('product')
        wish, created = Wishlist.objects.get_or_create(
            user=request.user,
            product_id=product_id
        )

        if not created:
            wish.delete()
            return Response({"status": "removed"})
        return Response({"status": "added"})