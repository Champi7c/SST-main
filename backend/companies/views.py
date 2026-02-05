from rest_framework import viewsets, permissions
from .models import Company, Site, Service, CompanyMembership, JobPosition
from .serializers import (
    CompanySerializer, SiteSerializer, ServiceSerializer,
    CompanyMembershipSerializer, JobPositionSerializer
)
from accounts.permissions import IsSuperAdminOrAdmin


class CompanyViewSet(viewsets.ModelViewSet):
    queryset = Company.objects.all()
    serializer_class = CompanySerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_permissions(self):
        """
        Permet la lecture à tous les utilisateurs authentifiés,
        mais restreint la création/modification/suppression aux super_admin et admin
        """
        if self.action in ['list', 'retrieve']:
            return [permissions.IsAuthenticated()]
        return [permissions.IsAuthenticated(), IsSuperAdminOrAdmin()]


class SiteViewSet(viewsets.ModelViewSet):
    queryset = Site.objects.all()
    serializer_class = SiteSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        queryset = Site.objects.all()
        company_id = self.request.query_params.get('company', None)
        if company_id:
            queryset = queryset.filter(company_id=company_id)
        return queryset


class ServiceViewSet(viewsets.ModelViewSet):
    queryset = Service.objects.all()
    serializer_class = ServiceSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        queryset = Service.objects.all()
        company_id = self.request.query_params.get('company', None)
        site_id = self.request.query_params.get('site', None)
        if company_id:
            queryset = queryset.filter(company_id=company_id)
        if site_id:
            queryset = queryset.filter(site_id=site_id)
        return queryset


class JobPositionViewSet(viewsets.ModelViewSet):
    queryset = JobPosition.objects.all()
    serializer_class = JobPositionSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        queryset = JobPosition.objects.all()
        company_id = self.request.query_params.get('company', None)
        if company_id:
            queryset = queryset.filter(company_id=company_id)
        return queryset


class CompanyMembershipViewSet(viewsets.ModelViewSet):
    queryset = CompanyMembership.objects.all()
    serializer_class = CompanyMembershipSerializer
    permission_classes = [permissions.IsAuthenticated, IsSuperAdminOrAdmin]
