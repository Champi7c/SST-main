from django.urls import path
from .views import (
    DashboardStatsView,
    HealthStatusReportView,
    SSTIndicatorsView,
    ExportDashboardExcelView,
    ExportDashboardPDFView,
)

urlpatterns = [
    path('dashboard-stats/', DashboardStatsView.as_view(), name='dashboard-stats'),
    path('health-status/', HealthStatusReportView.as_view(), name='health-status'),
    path('sst-indicators/', SSTIndicatorsView.as_view(), name='sst-indicators'),
    path('export/excel/', ExportDashboardExcelView.as_view(), name='export-dashboard-excel'),
    path('export/pdf/', ExportDashboardPDFView.as_view(), name='export-dashboard-pdf'),
]
