"""
URL routing for Clinical Whiteboards API.
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from apps.whiteboards.views import ClinicalWhiteboardViewSet

app_name = "whiteboards"

router = DefaultRouter()
router.register(r"", ClinicalWhiteboardViewSet, basename="whiteboard")

urlpatterns = [
    path("", include(router.urls)),
]
