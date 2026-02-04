from .views import *
from django.urls import path

urlpatterns = [
    path('category/', CateogoryList.as_view()),
    path('product/', ProductList.as_view()),
    path('product_img/', ProductImageList.as_view()),
]
