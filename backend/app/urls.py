from django.urls import path
from . import views
from . import export


urlpatterns = [
    path('api/preview-file/', views.preview_file, name='preview_file'),
    path('api/get-table-columns/', views.get_table_columns, name='get_table_columns'),
    path('api/column-recommendations/', views.column_recommendations, name='column_recommendations'),
    path('api/generate-data/', views.generate_data, name='generate_data'),
    path('api/export-data/', export.export_data, name='export_data'),
    path('api/import-data/', export.import_data, name='import_data'),
]