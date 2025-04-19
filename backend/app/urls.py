from django.urls import path
from .views import *
from .syn import *

urlpatterns = [
    path('api/merge-csv/', merge_csv, name='merge_csv'),
    path('api/generate-preview/', generate_preview, name='generate_preview'),
    path('api/generate-data/', generate_data, name='generate_data'),
    path('api/export-data/<str:data_id>/', export_data, name='export_data'),
]