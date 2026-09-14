from django.urls import path
from . import views

urlpatterns = [
    path("dashboard/", views.PatientDashboardView.as_view(), name="patient-dashboard"),
    path("profile/", views.PatientProfileView.as_view(), name="patient-profile"),
    path("medical-records/", views.PatientMedicalRecordsView.as_view(), name="patient-medical-records"),
    path("medical-records/<uuid:pk>/", views.PatientMedicalRecordDetailView.as_view(), name="patient-medical-record-detail"),
    path("vitals/", views.PatientVitalsView.as_view(), name="patient-vitals"),
    path("vitals/history/", views.PatientVitalsView.as_view(), name="patient-vitals-history"),
    path("risk-assessments/", views.PatientRiskAssessmentsView.as_view(), name="patient-risk-assessments"),
    path("risk-assessments/<uuid:pk>/", views.PatientRiskAssessmentDetailView.as_view(), name="patient-risk-assessment-detail"),
    path("predictions/", views.PatientPredictionsView.as_view(), name="patient-predictions"),
    path("predictions/<uuid:pk>/", views.PatientPredictionDetailView.as_view(), name="patient-prediction-detail"),
    path("appointments/", views.PatientAppointmentsView.as_view(), name="patient-appointments"),
    path("appointments/<uuid:pk>/", views.PatientAppointmentDetailView.as_view(), name="patient-appointment-detail"),
    path("messages/", views.PatientConversationsView.as_view(), name="patient-messages"),
    path("messages/<uuid:pk>/", views.PatientConversationDetailView.as_view(), name="patient-message-detail"),
    path("consent/", views.PatientConsentView.as_view(), name="patient-consent"),
    path("tasks/", views.PatientTasksView.as_view(), name="patient-tasks"),
    path("tasks/<uuid:pk>/complete/", views.PatientTaskCompleteView.as_view(), name="patient-task-complete"),
    path("reports/", views.PatientReportsView.as_view(), name="patient-reports"),
    path("reports/<uuid:pk>/", views.PatientReportDetailView.as_view(), name="patient-report-detail"),
    path("security/", views.PatientSecurityView.as_view(), name="patient-security"),
]
