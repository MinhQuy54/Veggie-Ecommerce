from .views import *
from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

urlpatterns = [
    path('category/', CateogoryList.as_view()),
    path('product/', ProductList.as_view()),
    path("product/<int:pk>/", ProductDetail.as_view()),
    path('product_img/', ProductImageList.as_view()),
    path('auth/login/', LoginView.as_view()),
    path("auth/token/refresh/", TokenRefreshView.as_view(), name=""),
    path('auth/register/', RegisterView.as_view()),
    path('auth/activate/<str:token>/', ActivateAccountView.as_view()),
    path('auth/reset-password/', RequestResetPasswordView.as_view()),
    path('auth/reset-password/confirm/', ResetPasswordView.as_view()),
    path('user/', UserList.as_view()),
    path('user/update/', UserDetail.as_view()),
    path('address/', AddressList.as_view()),
    path('address/<int:pk>/',AddressDetail.as_view()),
    path('cart/', CartList.as_view()),
    path('cart/<int:pk>/', CartDetail.as_view()),
    path('wish/', WishList.as_view()),
    path('wish/<int:pk>/', WishDetail.as_view()),
    path('wish/toggle/', WishToggle.as_view()),
    path('checkout/', CheckoutList.as_view()),
    path('search/', SearchListView.as_view()),
    path('order/', OrderList.as_view()),
    path('order/detail/<int:pk>/', OrderDetailView.as_view()),
    path('order/detail/cancel/<int:pk>/', OrderDetailView.as_view()),
    path('contact/', ContactList.as_view()),
    path('ghn/provinces/', GetProvincesView.as_view()),
    path('ghn/districts/', GetDistrictsView.as_view()),
    path('ghn/wards/', GetWardsView.as_view()),
]
