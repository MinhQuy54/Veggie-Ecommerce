from .views import *
from django.urls import path

urlpatterns = [
    path('category/', CateogoryList.as_view()),
    path('product/', ProductList.as_view()),
    path('product_img/', ProductImageList.as_view()),
    path('auth/login/', LoginView.as_view()),
    path('auth/register/', RegisterView.as_view()),
    path('auth/activate/<str:token>/', ActivateAccountView.as_view()),
    path('auth/reset-password/', RequestResetPasswordView.as_view()),
    path('auth/reset-password-confirm/', ResetPasswordConfirmView.as_view())
]
