from django.utils import timezone
from rest_framework import viewsets, permissions, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from .models import Vaccine, Vaccination, MedicalSurveillance, VaccineContraindication, VaccineRequirement, VaccinationAlert
from .serializers import (
    VaccineSerializer, VaccinationSerializer, MedicalSurveillanceSerializer,
    VaccineContraindicationSerializer, VaccineRequirementSerializer, VaccinationAlertSerializer,
)
from accounts.permissions import CanViewMedicalData, IsSuperAdminOrAdmin


class VaccineViewSet(viewsets.ModelViewSet):
    queryset = Vaccine.objects.filter(is_active=True)
    serializer_class = VaccineSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.SearchFilter]
    search_fields = ['name', 'code']


class VaccinationViewSet(viewsets.ModelViewSet):
    queryset = Vaccination.objects.all()
    serializer_class = VaccinationSerializer
    permission_classes = [permissions.IsAuthenticated, CanViewMedicalData]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['agent', 'vaccine', 'agent__company', 'agent__site', 'agent__service']
    search_fields = ['agent__matricule', 'agent__last_name', 'vaccine__name']
    ordering_fields = ['vaccination_date', 'next_due_date']
    ordering = ['-vaccination_date']


class MedicalSurveillanceViewSet(viewsets.ModelViewSet):
    queryset = MedicalSurveillance.objects.all()
    serializer_class = MedicalSurveillanceSerializer
    permission_classes = [permissions.IsAuthenticated, CanViewMedicalData]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['agent', 'surveillance_type', 'is_active', 'agent__company', 'agent__site', 'agent__service']
    search_fields = ['agent__matricule', 'agent__last_name']
    ordering_fields = ['start_date', 'next_review_date']
    ordering = ['-start_date']


class VaccineContraindicationViewSet(viewsets.ModelViewSet):
    queryset = VaccineContraindication.objects.all()
    serializer_class = VaccineContraindicationSerializer
    permission_classes = [permissions.IsAuthenticated, CanViewMedicalData]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['agent', 'vaccine', 'agent__company', 'agent__site', 'agent__service']
    search_fields = ['agent__matricule', 'agent__last_name', 'vaccine__name']

    def perform_create(self, serializer):
        serializer.save(recorded_by=self.request.user)


class VaccineRequirementViewSet(viewsets.ModelViewSet):
    queryset = VaccineRequirement.objects.all()
    serializer_class = VaccineRequirementSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['vaccine', 'job_position', 'risk_category', 'mandatory']
    search_fields = ['vaccine__name']

    def get_permissions(self):
        if self.action in ('create', 'update', 'partial_update', 'destroy'):
            return [permissions.IsAuthenticated(), IsSuperAdminOrAdmin()]
        return [permissions.IsAuthenticated()]


class VaccinationAlertViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = VaccinationAlert.objects.all()
    serializer_class = VaccinationAlertSerializer
    permission_classes = [permissions.IsAuthenticated, CanViewMedicalData]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['agent', 'vaccine', 'alert_type', 'acknowledged', 'agent__company', 'agent__site', 'agent__service']
    ordering_fields = ['due_date', 'created_at']
    ordering = ['due_date']

    @action(detail=True, methods=['post'])
    def acknowledge(self, request, pk=None):
        alert = self.get_object()
        alert.acknowledged = True
        alert.acknowledged_at = timezone.now()
        alert.acknowledged_by = request.user
        alert.save()
        return Response(self.get_serializer(alert).data)
