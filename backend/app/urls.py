from django.urls import path
from . import views
from . import export
from auth import *


urlpatterns = [
    path('api/preview-file/', views.preview_file, name='preview_file'),
    path('api/get-table-columns/', views.get_table_columns, name='get_table_columns'),
    path('api/column-recommendations/', views.column_recommendations, name='column_recommendations'),
    path('api/generate-data/', views.generate_data, name='generate_data'),
    path('api/export-data/', export.export_data, name='export_data'),
    path('api/import-data/', export.import_data, name='import_data'),
    
    #auth
    path('api/signup/', signup, name='signup'),
    path('api/verify-email/', verify_email, name='verify_email'),
    path('api/login/', login, name='login'),
    path('api/forgot-password/', forgot_password, name='forgot_password'),
    path('api/verify-reset-code/', verify_reset_code, name='verify_reset_code'),
    path('api/reset-password/', reset_password, name='reset_password'),
    path('api/change-password/', change_password, name='change_password'),
]