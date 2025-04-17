from django.urls import path
from .views import merge_csv

urlpatterns = [
    path('api/merge-csv/', merge_csv, name='merge_csv'),
]
