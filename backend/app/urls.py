from django.urls import path
from . import views
from . import export
from . import auth
from . import clean
from . import bot

urlpatterns = [
    path('api/preview-file/', views.preview_file, name='preview_file'),
    path('api/get-table-columns/', views.get_table_columns, name='get_table_columns'),
    path('api/column-recommendations/', views.column_recommendations, name='column_recommendations'),
    path('api/generate-data/', views.generate_data, name='generate_data'),
    path('api/export-data/', export.export_data, name='export_data'),
    path('api/import-data/', export.import_data, name='import_data'),
    
    #auth
    path('api/signup/', auth.signup, name='signup'),
    path('api/verify-email/', auth.verify_email, name='verify_email'),
    path('api/login/', auth.login, name='login'),
    path('api/forgot-password/', auth.forgot_password, name='forgot_password'),
    path('api/verify-reset-code/', auth.verify_reset_code, name='verify_reset_code'),
    path('api/reset-password/', auth.reset_password, name='reset_password'),
    path('api/change-password/', auth.change_password, name='change_password'),
    
    #clean
    path('api/import-data-clean/', clean.import_data, name='import_data'),
    path('api/process-data-clean/', clean.process_data, name='process_data'),
    path('api/get-csrf-token/', export.get_csrf_token , name='get_csrf_token'),
    
    #bot
    path('api/bot-chat/', bot.generate_synthetic_data, name='bot-chat'),
]