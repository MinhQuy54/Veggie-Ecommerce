from django.shortcuts import render, redirect, get_object_or_404
from django.http import Http404
from .models import *
from .serializers import *
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.contrib.auth import authenticate
from .momo import create_momo_payment

import uuid, time
from django.core.mail import send_mail
from django.conf import settings

# pagination
from .pagination import ProductPagination

# redis
from django.core.cache import cache
import requests
from django.contrib import messages
from django.db.models import Q

# Create your views here.


def build_frontend_url(path):
    base_url = settings.FRONTEND_URL.rstrip("/")
    normalized_path = path if path.startswith("/") else f"/{path}"
    return f"{base_url}{normalized_path}"

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
        serializer = LoginSerializer(data=request.data)

        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        username = serializer.validated_data.get('username')
        password = serializer.validated_data.get('password')

        if not username or not password:
            return Response({
                "detail" : "Thiếu thông tin đăng nhập"}, status=status.HTTP_400_BAD_REQUEST)

        matched_user = User.objects.filter(
            Q(username=username) | Q(email=username)
        ).first()
        
        user = authenticate(
            request,
            username=username,
            password=password
        )

        if not user:
            if matched_user and not matched_user.is_active:
                return Response(
                    {"error": "Tài khoản chưa được kích hoạt. Vui lòng kiểm tra email hoặc đăng ký lại."},
                    status=status.HTTP_400_BAD_REQUEST
                )
            return Response(
                {"error": "Sai tài khoản hoặc mật khẩu"}, status=status.HTTP_400_BAD_REQUEST)
        
        refresh = RefreshToken.for_user(user)

        return Response({
            "access": str(refresh.access_token),
            "refresh": str(refresh),
            "username": user.username,
            "email": user.email,
        }, status=status.HTTP_200_OK)
    
    
class RegisterView(APIView):
    permission_classes = [AllowAny]
    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        data = serializer.validated_data

        if User.objects.filter(email=data['email']).exists():
            return Response(
                {"error": "Email đã tồn tại"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        user = User.objects.create_user(
            username=data['username'],
            email=data['email'],
            password=data['password'],
            first_name=data.get('firstname', ''), 
            last_name=data.get('lastname', ''),   
        )
        
        return Response({
            "message": "Đăng ký thành công 🎉"
        }, status=status.HTTP_201_CREATED)


class ActivateAccountView(APIView):
    def get(self, request, token):
        user = User.objects.filter(activation_token=token).first()

        if not user:
            return redirect(build_frontend_url("/login.html?activated=error"))

        user.is_active = True
        user.activation_token = None
        user.save()

        return redirect(build_frontend_url("/login.html?activated=success"))

class RequestResetPasswordView(APIView):
    permission_classes = [AllowAny]
    def post(self, request):
        email = request.data.get('email')

        if not email:
            return Response({"error": "Vui lòng nhập email"}, status=400)
        
        user = User.objects.filter(email=email).first()

        if not user:
            return Response({"error": "Email không tồn tại"}, status=400)
        
        token = str(uuid.uuid4())
        user.reset_token = token
        user.reset_token_created = int(time.time())
        user.save()

        reset_link = f"/resetpass.html?token={token}"
        return Response({
            "message": "Link reset password",
            "reset_link": reset_link
        })
    
class ResetPasswordView(APIView):
    def post(self, request):
        serializer = PasswordFieldSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        token = request.data.get('token')
        password = serializer.validated_data.get('password')
        confirm = request.data.get("confirm_password")

        if not token or not password or not confirm:
            return Response({"error": "Thiếu dữ liệu"}, status=400)
        
        if password != confirm:
            return Response({"error": "Mật khẩu không khớp"}, status=400)
        
        user = User.objects.filter(reset_token=token).first()

        if not user:
            return Response({"error": "Token không hợp lệ"}, status=400)
        
        user.set_password(password)
        user.reset_token = None
        user.reset_token_created = None
        user.save()
        return Response({"message": "Reset password thành công"})

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
        confirm_password = request.data.get('confirm_password')

        serializer = UserSerializer(user, data=request.data, partial=True)

        if any([current_password, new_password, confirm_password]):

            password_serializer = ChangePasswordSerializer(data=request.data)

            if not password_serializer.is_valid():
                return Response(
                    password_serializer.errors,
                    status=status.HTTP_400_BAD_REQUEST
                )

            validated = password_serializer.validated_data
            current_password = validated['current_password']
            new_password = validated['new_password']

            if not user.check_password(current_password):
                return Response(
                    {"error": "Mật khẩu hiện tại không chính xác"},
                    status=status.HTTP_400_BAD_REQUEST
                )
            user.set_password(new_password)
            user.save()

        if serializer.is_valid():
            serializer.save()
            return Response({
                "message": "Cập nhật thành công",
                "user": serializer.data
            }, status=status.HTTP_200_OK)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    


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
    def get_obj(self, pk, user):
        try:
            return ShippingAddress.objects.get(pk=pk, user=user)
        except ShippingAddress.DoesNotExist:
            raise Http404()
    def get(self, request, pk):
        address = self.get_obj(pk, request.user)
        serializer = ShippingAddressSerializer(address)
        return Response(serializer.data)
    def put(self, request,pk):
        address = self.get_obj(pk, request.user)
        serializer = ShippingAddressSerializer(address,data=request.data)

        if serializer.is_valid():
            serializer.save(user=request.user)
            return Response(serializer.data)
        return Response(serializer.errors,status=status.HTTP_400_BAD_REQUEST)
    
    def delete(self, request,pk):
        address = self.get_obj(pk, request.user)
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
        quantity = int(request.data.get('quantity', 1))
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
    permission_classes = [IsAuthenticated]
    def get_obj(self, pk, user):
        try:
            return CartItem.objects.get(pk=pk, user=user)
        except CartItem.DoesNotExist:
            raise Http404()
    
    def get(self, request, pk):
        item = self.get_obj(pk, request.user)
        serializer = CartSerializer(item)
        return Response(serializer.data)
    
    def put(self, request, pk):
        item = self.get_obj(pk, request.user)
        serializer = CartSerializer(item, data=request.data, partial=True)

        if serializer.is_valid():
            serializer.save(user=request.user)
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request,pk):
        item = self.get_obj(pk, request.user)
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
    def get_obj(self, pk, user):
        try:
            return Wishlist.objects.get(pk=pk, user=user)
        except Wishlist.DoesNotExist:
            raise Http404()
    def get(self, request, pk):
        wish = self.get_obj(pk, request.user)
        serializer = WishListSerializer(wish)
        return Response(serializer.data)

    def delete(self, request,pk):
        wish = self.get_obj(pk, request.user)
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
    

class CheckoutList(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = CheckoutSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=400)
        
        user = request.user
        address = serializer.validated_data['shipping_address']
        payment_method = serializer.validated_data['payment_method']
        total_price = 15000

        if address.user != user:
            return Response({"error": "Địa chỉ giao hàng không hợp lệ"}, status=403)

        cart_items = CartItem.objects.filter(user=user)

        if not cart_items.exists():
            return Response({"error": "Giỏ hàng trống"}, status=400)
        
        for i in cart_items:
            total_price += i.product.price * i.quantity

        order = Order.objects.create(
            user=user,
            shipping_address=address,
            total_price=total_price,
            status=1
        )
        
        for item in cart_items:

            OrderItem.objects.create(
                order=order,
                product=item.product,
                quantity=item.quantity,
                price=item.product.price
            )

        Payment.objects.create(
            order=order,
            payment_method=payment_method,
            transaction_id="",
            amount=total_price,
            status=1
        )

        if payment_method.lower() == "momo":
            try:
                unique_order_id = f"{order.id}_{int(time.time())}"
                momo_res = create_momo_payment(int(total_price), unique_order_id)
                print("MoMo response:", momo_res)
                if momo_res.get("resultCode") != 0:
                        return Response({
                            "error": momo_res.get("message", "MoMo payment failed"),
                            "momo_res": momo_res
                        }, status=400)
                
                cart_items.delete()
                return Response({
                        "payment_method": "momo",
                        "payUrl": momo_res.get("payUrl")
                    })

            except Exception as e:
                print("MoMo EXCEPTION:", e)
                return Response({
                    "error": "Lỗi server khi gọi MoMo"
                }, status=500)

        cart_items.delete()
        return Response({
            "message": "Đặt hàng thành công",
            "order_id": order.id
        })



class SearchListView(APIView):
    def get(self, request):
        key = request.query_params.get('q')
        queryset = Product.objects.all()
        product = queryset

        if key:
            product = queryset.filter(name__icontains=key)

        paginator = ProductPagination()
        paginated_products = paginator.paginate_queryset(product, request)
        serializer = ProductSerializer(paginated_products, many=True)
        
        return paginator.get_paginated_response(serializer.data)
        # return Response(serializer.data)


class OrderList(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request):
        order = Order.objects.filter(user=request.user)
        serializer = OrderSerializer(order,many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

class OrderDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        try:
            order = Order.objects.get(pk=pk, user=request.user)
            serializer = OrderDetailSerializer(order)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except Order.DoesNotExist:
            return Response({"error": "Đơn hàng không tồn tại"}, status=status.HTTP_404_NOT_FOUND)
    
    def post(self, request, pk):
        try:
            order = Order.objects.get(pk=pk,user=request.user)

            if order.status not in [1,2]:
                return Response({"error": "Không thể hủy đơn"}, status=400)
            
            for item in order.items.all():
                product = item.product
                product.stock += item.quantity
                product.save()
            order.status = 5
            order.save()
            return Response({"message": "Đã hủy đơn"})
        except Order.DoesNotExist:
            return Response({"error": "Không tìm thấy đơn"}, status=404)


class ContactList(APIView):

    def post(self, request):
        serializers = ContactSerializer(data=request.data)

        if serializers.is_valid():
            contact = serializers.save()

            admins = User.objects.filter(is_staff = True)
            for admin in admins:
                Notification.objects.create(
                    user=admin,
                    type="CONTACT",
                    message=f"Liên hệ mới từ {contact.full_name}"
                )
            return Response({
                "message": "Gửi liên hệ thành công"
            }, status=status.HTTP_201_CREATED)
        return Response(serializers.errors, status=400)

def admin_contact_view(request):
    contacts = Contact.objects.all().order_by('-created_at')
    selected_contact = None

    contact_id = request.GET.get('id')
    if contact_id:
        selected_contact = get_object_or_404(Contact, id=contact_id)

    if request.method == "POST":
        contact_id = request.POST.get('contact_id')
        reply_content = request.POST.get('reply_content')

        contact = get_object_or_404(Contact, id=contact_id)

        send_mail(
            subject="Phản hồi từ Veggie Shop",
            message=reply_content,
            from_email=settings.EMAIL_HOST_USER,
            recipient_list=[contact.email],
            fail_silently=False,
        )

        contact.reply_content = reply_content
        contact.is_reply = True
        contact.save()

        messages.success(request, "Đã gửi phản hồi thành công!")

        return redirect(f"/admin/contacts?id={contact.id}")

    return render(request, "admin/contact_reply.html", {
        "contacts": contacts,
        "selected_contact": selected_contact
    })
    

class GHNProxyBase(APIView):
    permission_classes = [IsAuthenticated]
    ghn_headers = {
        "Token" : settings.GHN_TOKEN,
        "Content-Type" : "application/json"
    }
    if settings.GHN_SHOP_ID:
        ghn_headers["ShopId"] = str(settings.GHN_SHOP_ID)

    def request_ghn(self, method, endpoint, payload=None):
        url = f"{settings.GHN_API_URL}{endpoint}"
        try: 
            response = requests.request(
                method=method,
                url=url,
                headers=self.ghn_headers,
                json=payload,
                timeout=15
            )
            data = response.json()
        except requests.RequestException as exc:
            return Response({
                "message" : f"Không kết nối được GHN: {exc}"
            }, status=status.HTTP_502_BAD_GATEWAY)
        except ValueError:
            return Response(
                {"message": "GHN trả về dữ liệu không hợp lệ."},
                status=status.HTTP_502_BAD_GATEWAY,
            )

        return Response(data, status=response.status_code)
    
class GetProvincesView(GHNProxyBase):
    def get(self, request):
        cache_key = "ghn_provinces"

        data = cache.get(cache_key)
        if data:
            return Response(data)
        response = self.request_ghn("GET", "province")
        if response.status_code == status.HTTP_200_OK:
            data = response.data
            cache.set(cache_key, data, timeout=86400)
        return response
    

class GetDistrictsView(GHNProxyBase):
    def post(self, request):
        province_id = request.data.get('province_id')
        if not province_id:
            return Response({"message": "Thiếu province_id"}, status=status.HTTP_400_BAD_REQUEST)
        
        cache_key = f"ghn_districts_{province_id}"

        data = cache.get(cache_key)
        if data:
            return Response(data)

        payload = {"province_id": int(province_id)}
        response = self.request_ghn("POST", "district", payload)
        if response.status_code == status.HTTP_200_OK:
            data = response.data
            cache.set(cache_key, data, timeout=86400)
        return response

class GetWardsView(GHNProxyBase):
    def post(self, request):
        district_id = request.data.get('district_id')

        if not district_id:
            return Response({"message": "Thiếu district_id"}, status=400)

        cache_key = f"ghn_wards_{district_id}"

        data = cache.get(cache_key)
        if data:
            return Response(data)

        payload = {"district_id": int(district_id)}
        response = self.request_ghn("POST", "ward", payload)
        if response.status_code == status.HTTP_200_OK:
            data = response.data
            cache.set(cache_key, data, timeout=86400)
        return response
