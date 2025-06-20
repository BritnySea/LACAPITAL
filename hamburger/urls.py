from django.urls import path
from .views import menu

urlpatterns = [
    path('hamburguesas/', menu, name='menu'),
]