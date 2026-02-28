from .views import *
from django.urls import path

urlpatterns = [
    path('category/', CateogoryList.as_view()),
    path('product/', ProductList.as_view()),
    path("product/<int:pk>/", ProductDetail.as_view()),
    path('product_img/', ProductImageList.as_view()),
    path('auth/login/', LoginView.as_view()),
    path('auth/register/', RegisterView.as_view()),
    path('auth/activate/<str:token>/', ActivateAccountView.as_view()),
    path('auth/reset-password/', RequestResetPasswordView.as_view()),
    path('auth/reset-password-confirm/', ResetPasswordConfirmView.as_view()),
    path('user/', UserList.as_view()),
    path('user/update/', UserDetail.as_view()),
    path('address/', AddressList.as_view()),
    path('address/<int:pk>/',AddressDetail.as_view()),
    path('cart/', CartList.as_view())
]
