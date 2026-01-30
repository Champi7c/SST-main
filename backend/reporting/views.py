"""
Vues pour le reporting et les indicateurs SST.
Accès par profil : DG, RH, HSE, Médecin (vue complète).
"""
from datetime import datetime, timedelta
from io import BytesIO

from rest_framework import views, status
from rest_framework.response import Response
from django.db.models import Sum
from django.utils import timezone
from django.http import HttpResponse

from .permissions import IsReportingProfile, IsMedicalReportingProfile
from .services import build_dashboard_stats

from medical.models import Agent
from accidents.models import WorkAccident, OccupationalDisease


def _parse_dates(request):
    """
    Si start_date et end_date sont absents → (None, None) = tout la base (dashboard).
    Sinon → période [start_date, end_date] (exports, filtres).
    """
    end_date = request.query_params.get('end_date')
    start_date = request.query_params.get('start_date')
    if not start_date and not end_date:
        return None, None
    if end_date:
        try:
            end_date = datetime.strptime(str(end_date)[:10], '%Y-%m-%d').date()
        except ValueError:
            end_date = timezone.now().date()
    else:
        end_date = timezone.now().date()
    if start_date:
        try:
            start_date = datetime.strptime(str(start_date)[:10], '%Y-%m-%d').date()
        except ValueError:
            start_date = end_date - timedelta(days=30)
    else:
        start_date = end_date - timedelta(days=30)
    return start_date, end_date


def _parse_filters(request):
    c = request.query_params.get('company')
    s = request.query_params.get('site')
    svc = request.query_params.get('service')
    company_id = int(c) if c and str(c).isdigit() else None
    site_id = int(s) if s and str(s).isdigit() else None
    service_id = int(svc) if svc and str(svc).isdigit() else None
    return company_id, site_id, service_id


class DashboardStatsView(views.APIView):
    """
    Tableau de bord : indicateurs globaux / par entreprise / site / service.
    """
    permission_classes = [IsReportingProfile]

    def get(self, request):
        start_date, end_date = _parse_dates(request)
        company_id, site_id, service_id = _parse_filters(request)
        data = build_dashboard_stats(
            company_id=company_id,
            site_id=site_id,
            service_id=service_id,
            start_date=start_date,
            end_date=end_date,
        )
        return Response(data)


class HealthStatusReportView(views.APIView):
    """
    Rapport d'état de santé (agrégats). Vue complète : Médecin, Infirmier, Super Admin.
    """
    permission_classes = [IsMedicalReportingProfile]

    def get(self, request):
        company_id, site_id, service_id = _parse_filters(request)
        filters = {}
        if company_id:
            filters['company_id'] = company_id
        if site_id:
            filters['site_id'] = site_id
        if service_id:
            filters['service_id'] = service_id

        agents = Agent.objects.filter(**filters, is_active=True)
        agents_with_dmst = agents.filter(dmst__isnull=False).count()
        agents_under_surveillance = agents.filter(dmst__under_surveillance=True).count()
        agents_with_pathologies = agents.filter(pathologies__is_active=True).distinct().count()
        agents_with_handicap = agents.filter(dmst__handicap=True).count()
        pregnant_agents = agents.filter(dmst__pregnancy=True).count()

        return Response({
            'total_agents': agents.count(),
            'agents_with_dmst': agents_with_dmst,
            'agents_under_surveillance': agents_under_surveillance,
            'agents_with_pathologies': agents_with_pathologies,
            'agents_with_handicap': agents_with_handicap,
            'pregnant_agents': pregnant_agents,
        })


class SSTIndicatorsView(views.APIView):
    """
    Indicateurs SST clés : taux de fréquence, gravité, AT, MP.
    """
    permission_classes = [IsReportingProfile]

    def get(self, request):
        start_date, end_date = _parse_dates(request)
        company_id, site_id, service_id = _parse_filters(request)
        if end_date - start_date > timedelta(days=400):
            start_date = end_date - timedelta(days=365)

        filters = {}
        if company_id:
            filters['agent__company_id'] = company_id
        if site_id:
            filters['agent__site_id'] = site_id
        if service_id:
            filters['agent__service_id'] = service_id

        accidents = WorkAccident.objects.filter(
            **filters,
            accident_date__date__range=[start_date, end_date],
        )
        total_accidents = accidents.count()
        total_work_stoppage_days = accidents.aggregate(
            Sum('work_stoppage_days')
        )['work_stoppage_days__sum'] or 0

        agent_filters = {}
        if company_id:
            agent_filters['company_id'] = company_id
        if site_id:
            agent_filters['site_id'] = site_id
        if service_id:
            agent_filters['service_id'] = service_id
        agents_count = Agent.objects.filter(**agent_filters, is_active=True).count()
        total_hours = agents_count * 2000

        frequency_rate = (total_accidents / total_hours * 1_000_000) if total_hours > 0 else 0
        severity_rate = (total_work_stoppage_days / total_hours * 1000) if total_hours > 0 else 0

        return Response({
            'period': {'start_date': start_date, 'end_date': end_date},
            'frequency_rate': round(frequency_rate, 2),
            'severity_rate': round(severity_rate, 2),
            'total_accidents': total_accidents,
            'total_work_stoppage_days': total_work_stoppage_days,
        })


class ExportDashboardExcelView(views.APIView):
    """
    Export tableau de bord en Excel. Agrégats uniquement (pas de données médicales nominatives).
    """
    permission_classes = [IsReportingProfile]

    def get(self, request):
        try:
            import openpyxl
            from openpyxl.styles import Font, Alignment
        except ImportError:
            return Response(
                {'error': 'openpyxl non installé'},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

        start_date, end_date = _parse_dates(request)
        company_id, site_id, service_id = _parse_filters(request)
        data = build_dashboard_stats(
            company_id=company_id,
            site_id=site_id,
            service_id=service_id,
            start_date=start_date,
            end_date=end_date,
        )

        wb = openpyxl.Workbook()
        ws = wb.active
        ws.title = "Tableau de bord SST"
        ws.append(["Indicateur", "Valeur"])
        pd = data['period']
        period_label = "Toute la base" if (pd.get('start_date') is None and pd.get('end_date') is None) else f"{pd['start_date']} → {pd['end_date']}"
        ws.append(["Période", period_label])
        ws.append([])
        for k, v in data['stats'].items():
            ws.append([k.replace('_', ' ').title(), v])
        ws.append([])
        ws.append(["Répartition par site"])
        for row in data['distribution']['by_site']:
            ws.append([row.get('name', ''), row.get('agents_count', 0), row.get('visits_count', 0), row.get('accidents_count', 0)])
        ws.append([])
        ws.append(["Répartition par service"])
        for row in data['distribution']['by_service']:
            ws.append([row.get('name', ''), row.get('agents_count', 0), row.get('visits_count', 0)])

        buf = BytesIO()
        wb.save(buf)
        buf.seek(0)
        response = HttpResponse(
            buf.read(),
            content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        )
        response['Content-Disposition'] = 'attachment; filename="dashboard_sst.xlsx"'
        return response


class ExportDashboardPDFView(views.APIView):
    """
    Export tableau de bord en PDF. Agrégats uniquement.
    """
    permission_classes = [IsReportingProfile]

    def get(self, request):
        try:
            from reportlab.lib.pagesizes import A4
            from reportlab.pdfgen import canvas
            from reportlab.lib.units import cm
        except ImportError:
            return Response(
                {'error': 'reportlab non installé'},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

        start_date, end_date = _parse_dates(request)
        company_id, site_id, service_id = _parse_filters(request)
        data = build_dashboard_stats(
            company_id=company_id,
            site_id=site_id,
            service_id=service_id,
            start_date=start_date,
            end_date=end_date,
        )

        buf = BytesIO()
        c = canvas.Canvas(buf, pagesize=A4)
        y = 800
        c.setFont("Helvetica-Bold", 14)
        c.drawString(2 * cm, y, "Tableau de bord SST")
        y -= 0.8 * cm
        c.setFont("Helvetica", 10)
        pd = data['period']
        period_label = "Toute la base" if (pd.get('start_date') is None and pd.get('end_date') is None) else f"{pd['start_date']} → {pd['end_date']}"
        c.drawString(2 * cm, y, f"Période : {period_label}")
        y -= 1 * cm
        for k, v in data['stats'].items():
            c.drawString(2 * cm, y, f"{k.replace('_', ' ').title()} : {v}")
            y -= 0.5 * cm
        c.drawString(2 * cm, y, "")
        y -= 0.5 * cm
        c.drawString(2 * cm, y, "Répartition par site (effectifs, visites, accidents)")
        y -= 0.5 * cm
        for row in data['distribution']['by_site'][:15]:
            c.drawString(2 * cm, y, f"  {row.get('name', '')} — {row.get('agents_count', 0)} / {row.get('visits_count', 0)} / {row.get('accidents_count', 0)}")
            y -= 0.4 * cm
        c.save()
        buf.seek(0)
        response = HttpResponse(buf.read(), content_type='application/pdf')
        response['Content-Disposition'] = 'attachment; filename="dashboard_sst.pdf"'
        return response
