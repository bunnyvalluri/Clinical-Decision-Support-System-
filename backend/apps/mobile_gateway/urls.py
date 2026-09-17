"""
Mobile Gateway REST API URLs.
Versioned under /api/v1/mobile/
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from apps.mobile_gateway import views

app_name = "mobile_gateway"

router = DefaultRouter()
router.register(r"devices", views.MobileDeviceViewSet, basename="devices")
router.register(r"events", views.MobileEventViewSet, basename="events")
router.register(r"destinations", views.ForwardingDestinationViewSet, basename="destinations")
router.register(r"rules", views.ForwardingRuleViewSet, basename="rules")
router.register(r"deliveries", views.DeliveryReceiptViewSet, basename="deliveries")
router.register(r"dead-letters", views.DeadLetterEventViewSet, basename="dead-letters")
router.register(r"kill-switch", views.EmergencyKillSwitchViewSet, basename="kill-switch")

urlpatterns = [
    path("events/ingest/", views.MobileEventIngestView.as_view(), name="event-ingest"),
    path("audit/", views.MobileGatewayAuditView.as_view(), name="gateway-audit"),
    path("", include(router.urls)),
]
