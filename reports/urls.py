from django.urls import path
from .views import ReportUploadView, ExtractedDataView, GenerateExplanationView, DoctorPrepView, ReportHistoryView, ReportChatView, TrendTrackerView, AIEvaluationDashboardView # Import the Dashboard view
from .views import SignupView, CustomLoginView, AdminUserAnalyticsView
from .views import LogoutView, AdminManageUserView
urlpatterns = [
    path('upload/', ReportUploadView.as_view(), name='report-upload'),
    path('<uuid:job_id>/data/', ExtractedDataView.as_view(), name='extracted-data'),
    path('<uuid:job_id>/explain/', GenerateExplanationView.as_view(), name='generate-explanation'),
    path('<uuid:job_id>/doctor-prep/', DoctorPrepView.as_view(), name='doctor-prep'),
    path('history/', ReportHistoryView.as_view(), name='report-history'),
    path('<uuid:job_id>/chat/', ReportChatView.as_view(), name='report-chat'),
    path('trends/', TrendTrackerView.as_view(), name='report-trends'),
    
    # NEW: The door for the Admin Dashboard metrics
    path('evaluation/', AIEvaluationDashboardView.as_view(), name='ai-evaluation'),

    path('signup/', SignupView.as_view(), name='signup'),
    path('login/', CustomLoginView.as_view(), name='custom-login'),
    path('admin-users/', AdminUserAnalyticsView.as_view(), name='admin-users'),

    path('logout/', LogoutView.as_view(), name='logout'),
    path('admin-users/<int:user_id>/', AdminManageUserView.as_view(), name='admin-manage-user'),
]