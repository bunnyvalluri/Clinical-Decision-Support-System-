"""
URL routing for Engineering Loops (Prompt 45).
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from apps.engineering_loops.views import (
    EngineeringLoopViewSet,
    EngineeringLoopRunViewSet,
    EngineeringLoopBudgetViewSet,
    EngineeringToolRegistryViewSet,
    EngineeringLoopHealthView,
)

app_name = "engineering_loops"

router = DefaultRouter()
router.register(r"loops", EngineeringLoopViewSet, basename="engineering-loops")
router.register(r"runs", EngineeringLoopRunViewSet, basename="engineering-runs")
router.register(r"budgets", EngineeringLoopBudgetViewSet, basename="engineering-budgets")
router.register(r"tools", EngineeringToolRegistryViewSet, basename="engineering-tools")

urlpatterns = [
    path("health/", EngineeringLoopHealthView.as_view(), name="engineering-loops-health"),
    path("", include(router.urls)),
]
