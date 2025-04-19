from django.urls import path
from . import views

urlpatterns = [
    path('api/preview-file/', views.preview_file, name='preview_file'),
    path('api/get-table-columns/', views.get_table_columns, name='get_table_columns'),
    path('api/column-recommendations/', views.column_recommendations, name='column_recommendations'),
    path('api/generate-data/', views.generate_data, name='generate_data'),
]