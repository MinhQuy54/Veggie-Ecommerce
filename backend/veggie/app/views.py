from django.shortcuts import render
from django.http import Http404
from .models import *
from .serializers import *
from rest_framework import status
from rest_framework.decorators import APIView
from rest_framework.response import Response
# Create your views here.

class CateogoryList(APIView):
    def get(self, requets):
        category = Category.objects.all()
        serializer = CategorySerializer(category, many=True)
        return Response(serializer.data)
    
class ProductList(APIView):
    def get(self, requets):
        product = Product.objects.all()
        serializer = ProductSerializer(product, many=True)
        return Response(serializer.data)

class ProductImageList(APIView):
    def get(self, requets):
        product_img = ProductImage.objects.all()
        serializer = ProductImageSerializer(product_img, many=True)
        return Response(serializer.data)
