"""
URL configuration for SST Platform project.
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.http import JsonResponse

# Health check endpoint pour Railway
def health_check(request):
    return JsonResponse({
        'status': 'healthy',
        'service': 'SST Platform API',
        'debug': settings.DEBUG
    })

urlpatterns = [
    path('api/health/', health_check, name='health_check'),
    path('admin/', admin.site.urls),
    path('api/auth/', include('accounts.urls')),
    path('api/companies/', include('companies.urls')),
    path('api/medical/', include('medical.urls')),
    path('api/visits/', include('visits.urls')),
    path('api/accidents/', include('accidents.urls')),
    path('api/vaccination/', include('vaccination.urls')),
    path('api/prevention/', include('prevention.urls')),
    path('api/training/', include('training.urls')),
    path('api/reporting/', include('reporting.urls')),
    path('api/audit/', include('audit.urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
