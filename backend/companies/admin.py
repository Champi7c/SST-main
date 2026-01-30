from django.contrib import admin
from .models import Company, Site, Service, CompanyMembership, JobPosition


@admin.register(Company)
class CompanyAdmin(admin.ModelAdmin):
    list_display = ['name', 'siret', 'email', 'phone', 'is_active', 'created_at']
    list_filter = ['is_active', 'created_at']
    search_fields = ['name', 'siret', 'email']


@admin.register(Site)
class SiteAdmin(admin.ModelAdmin):
    list_display = ['name', 'company', 'phone', 'is_active', 'created_at']
    list_filter = ['company', 'is_active']
    search_fields = ['name', 'company__name']


@admin.register(Service)
class ServiceAdmin(admin.ModelAdmin):
    list_display = ['name', 'company', 'site', 'is_active', 'created_at']
    list_filter = ['company', 'site', 'is_active']
    search_fields = ['name', 'company__name']


@admin.register(CompanyMembership)
class CompanyMembershipAdmin(admin.ModelAdmin):
    list_display = ['user', 'company', 'site', 'is_primary', 'created_at']
    list_filter = ['company', 'is_primary', 'created_at']
    search_fields = ['user__username', 'company__name']


@admin.register(JobPosition)
class JobPositionAdmin(admin.ModelAdmin):
    list_display = ['name', 'company', 'code', 'is_active', 'created_at']
    list_filter = ['company', 'is_active']
    search_fields = ['name', 'code', 'company__name']
