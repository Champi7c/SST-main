from rest_framework import serializers
from .models import Company, Site, Service, CompanyMembership, JobPosition, Doctor


class CompanySerializer(serializers.ModelSerializer):
    sites_count = serializers.IntegerField(source='sites.count', read_only=True)
    services_count = serializers.IntegerField(source='services.count', read_only=True)
    
    class Meta:
        model = Company
        fields = '__all__'


class SiteSerializer(serializers.ModelSerializer):
    company_name = serializers.CharField(source='company.name', read_only=True)
    
    class Meta:
        model = Site
        fields = '__all__'


class ServiceSerializer(serializers.ModelSerializer):
    company_name = serializers.CharField(source='company.name', read_only=True)
    site_name = serializers.CharField(source='site.name', read_only=True, allow_null=True)
    
    class Meta:
        model = Service
        fields = '__all__'


class JobPositionSerializer(serializers.ModelSerializer):
    company_name = serializers.CharField(source='company.name', read_only=True)
    
    class Meta:
        model = JobPosition
        fields = '__all__'


class DoctorSerializer(serializers.ModelSerializer):
    company_name = serializers.CharField(source='company.name', read_only=True, allow_null=True)
    full_name = serializers.ReadOnlyField()

    class Meta:
        model = Doctor
        fields = '__all__'


class CompanyMembershipSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='user.get_full_name', read_only=True)
    company_name = serializers.CharField(source='company.name', read_only=True)
    site_name = serializers.CharField(source='site.name', read_only=True, allow_null=True)
    
    class Meta:
        model = CompanyMembership
        fields = '__all__'
