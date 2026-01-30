from django.utils import timezone
from django.db.models import Count, Q
from rest_framework import viewsets, permissions, filters
from rest_framework.views import APIView
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from .models import RiskCategory, Risk, PreventiveAction, IndividualExposureSheet, IndividualRiskSheet
from .serializers import (
    RiskCategorySerializer, RiskSerializer, PreventiveActionSerializer,
    IndividualExposureSheetSerializer, IndividualRiskSheetSerializer
)
from medical.models import Agent


class RiskCategoryViewSet(viewsets.ModelViewSet):
    queryset = RiskCategory.objects.filter(is_active=True)
    serializer_class = RiskCategorySerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.SearchFilter]
    search_fields = ['name', 'code']


class RiskViewSet(viewsets.ModelViewSet):
    queryset = Risk.objects.all()
    serializer_class = RiskSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['company', 'site', 'service', 'category', 'severity', 'is_active']
    search_fields = ['name', 'description']
    ordering_fields = ['identification_date', 'created_at']
    ordering = ['-identification_date']


class PreventiveActionViewSet(viewsets.ModelViewSet):
    queryset = PreventiveAction.objects.all()
    serializer_class = PreventiveActionSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['risk', 'action_type', 'status', 'responsible']
    search_fields = ['title', 'description']
    ordering_fields = ['planned_date', 'due_date', 'completed_date']
    ordering = ['-planned_date']
    
    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)


class IndividualExposureSheetViewSet(viewsets.ModelViewSet):
    queryset = IndividualExposureSheet.objects.all()
    serializer_class = IndividualExposureSheetSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['agent', 'agent__company', 'agent__site', 'agent__service']
    
    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)


class IndividualRiskSheetViewSet(viewsets.ModelViewSet):
    queryset = IndividualRiskSheet.objects.all()
    serializer_class = IndividualRiskSheetSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['agent', 'agent__company', 'agent__site', 'agent__service']
    
    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)


def _prevention_filters(request):
    c = request.query_params.get('company')
    s = request.query_params.get('site')
    svc = request.query_params.get('service')
    company_id = int(c) if c and str(c).isdigit() else None
    site_id = int(s) if s and str(s).isdigit() else None
    service_id = int(svc) if svc and str(svc).isdigit() else None
    return company_id, site_id, service_id


class PreventionIndicatorsView(APIView):
    """Indicateurs prévention : risques par catégorie, plan d'actions, FIE/FIR, risques liés AT/MP."""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        company_id, site_id, service_id = _prevention_filters(request)
        today = timezone.now().date()

        risk_f = {}
        if company_id:
            risk_f['company_id'] = company_id
        if site_id:
            risk_f['site_id'] = site_id
        if service_id:
            risk_f['service_id'] = service_id
        risk_f['is_active'] = True
        risks_qs = Risk.objects.filter(**risk_f)

        by_category = list(
            risks_qs.values('category__name', 'category__id')
            .annotate(count=Count('id'))
            .order_by('-count')
        )
        by_severity = list(risks_qs.values('severity').annotate(count=Count('id')).order_by('severity'))
        by_probability = list(risks_qs.values('probability').annotate(count=Count('id')).order_by('probability'))

        act_f = {}
        if company_id:
            act_f['risk__company_id'] = company_id
        if site_id:
            act_f['risk__site_id'] = site_id
        if service_id:
            act_f['risk__service_id'] = service_id
        actions_qs = PreventiveAction.objects.filter(**act_f).exclude(status='cancelled')
        total_actions = actions_qs.count()
        completed = actions_qs.filter(status='completed').count()
        advancement = round(100 * completed / total_actions, 2) if total_actions else 0
        overdue = actions_qs.filter(due_date__lt=today).exclude(status='completed').count()

        agent_f = {'is_active': True}
        if company_id:
            agent_f['company_id'] = company_id
        if site_id:
            agent_f['site_id'] = site_id
        if service_id:
            agent_f['service_id'] = service_id
        agents_total = Agent.objects.filter(**agent_f).count()
        fie_f = {'agent__is_active': True}
        if company_id:
            fie_f['agent__company_id'] = company_id
        if site_id:
            fie_f['agent__site_id'] = site_id
        if service_id:
            fie_f['agent__service_id'] = service_id
        with_fie = IndividualExposureSheet.objects.filter(**fie_f).count()
        fir_f = {'agent__is_active': True}
        if company_id:
            fir_f['agent__company_id'] = company_id
        if site_id:
            fir_f['agent__site_id'] = site_id
        if service_id:
            fir_f['agent__service_id'] = service_id
        with_fir = IndividualRiskSheet.objects.filter(**fir_f).count()
        coverage_fie = round(100 * with_fie / agents_total, 2) if agents_total else 0
        coverage_fir = round(100 * with_fir / agents_total, 2) if agents_total else 0

        risks_with_at_mp = Risk.objects.filter(**risk_f).filter(
            Q(work_accident_links__id__isnull=False) | Q(occupational_disease_links__id__isnull=False)
        ).distinct().count()

        return Response({
            'by_category': by_category,
            'by_severity': by_severity,
            'by_probability': by_probability,
            'total_risks': risks_qs.count(),
            'actions_total': total_actions,
            'actions_completed': completed,
            'actions_advancement_rate': advancement,
            'actions_overdue': overdue,
            'agents_total': agents_total,
            'with_fie': with_fie,
            'with_fir': with_fir,
            'coverage_fie_pct': coverage_fie,
            'coverage_fir_pct': coverage_fir,
            'risks_linked_at_mp': risks_with_at_mp,
        })
