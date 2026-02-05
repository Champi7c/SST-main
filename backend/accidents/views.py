from rest_framework import viewsets, permissions, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django.utils import timezone
from django.db.models import Count, Q, Avg, Sum
from datetime import timedelta
from .models import WorkAccident, OccupationalDisease
from .serializers import WorkAccidentSerializer, OccupationalDiseaseSerializer


class WorkAccidentViewSet(viewsets.ModelViewSet):
    """
    ViewSet pour la gestion des accidents de travail
    Accessible par: Médecin, RH, HSE, Direction (lecture)
    """
    queryset = WorkAccident.objects.select_related('agent', 'declared_by', 'closed_by').all()
    serializer_class = WorkAccidentSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['agent', 'accident_type', 'severity', 'status', 'work_stoppage', 'agent__company', 'agent__site', 'agent__service']
    search_fields = ['agent__matricule', 'agent__last_name', 'location', 'mechanism', 'description']
    ordering_fields = ['accident_date', 'declaration_date', 'created_at']
    ordering = ['-accident_date']
    
    def get_queryset(self):
        """Filtre selon les permissions"""
        queryset = super().get_queryset()
        
        # Filtrage par entreprise si l'utilisateur n'est pas super_admin
        if hasattr(self.request, 'user') and self.request.user.role != 'super_admin':
            user_companies = self.request.user.company_memberships.values_list('company_id', flat=True)
            if user_companies:
                queryset = queryset.filter(agent__company_id__in=user_companies)
        
        return queryset
    
    def perform_create(self, serializer):
        """Création avec envoi automatique des alertes"""
        accident = serializer.save(declared_by=self.request.user)
        accident.send_alerts()
    
    @action(detail=True, methods=['post'])
    def close(self, request, pk=None):
        """Clôturer un accident"""
        accident = self.get_object()
        if accident.status == 'closed':
            return Response(
                {'detail': 'Cet accident est déjà clôturé.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        accident.status = 'closed'
        accident.closed_date = timezone.now()
        accident.closed_by = request.user
        accident.save()
        serializer = self.get_serializer(accident)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def statistics(self, request):
        """Statistiques sur les accidents"""
        from django.db.models import Sum
        
        try:
            queryset = self.get_queryset()
            
            # Période (par défaut: 12 derniers mois)
            months = int(request.query_params.get('months', 12))
            start_date = timezone.now() - timedelta(days=months * 30)
            queryset = queryset.filter(accident_date__gte=start_date)
            
            # Statistiques de base
            total = queryset.count()
            
            # Par type
            by_type = {}
            for item in queryset.values('accident_type').annotate(count=Count('id')):
                by_type[item['accident_type']] = item['count']
            
            # Par gravité
            by_severity = {}
            for item in queryset.values('severity').annotate(count=Count('id')):
                by_severity[item['severity']] = item['count']
            
            # Par statut
            by_status = {}
            for item in queryset.values('status').annotate(count=Count('id')):
                by_status[item['status']] = item['count']
            
            # Arrêts de travail
            with_work_stoppage = queryset.filter(work_stoppage=True).count()
            
            # Total jours d'arrêt
            total_work_stoppage_days = queryset.aggregate(
                total=Sum('work_stoppage_days')
            )['total'] or 0
            
            # Par entreprise
            by_company = []
            try:
                for item in queryset.select_related('agent__company').values('agent__company__name').annotate(count=Count('id')).filter(agent__company__isnull=False):
                    by_company.append({
                        'agent__company__name': item.get('agent__company__name', ''),
                        'count': item.get('count', 0)
                    })
            except Exception:
                by_company = []
            
            # Par site
            by_site = []
            try:
                for item in queryset.select_related('agent__site').values('agent__site__name').annotate(count=Count('id')).filter(agent__site__isnull=False):
                    by_site.append({
                        'agent__site__name': item.get('agent__site__name', ''),
                        'count': item.get('count', 0)
                    })
            except Exception:
                by_site = []
            
            # Par service
            by_service = []
            try:
                for item in queryset.select_related('agent__service').values('agent__service__name').annotate(count=Count('id')).filter(agent__service__isnull=False):
                    by_service.append({
                        'agent__service__name': item.get('agent__service__name', ''),
                        'count': item.get('count', 0)
                    })
            except Exception:
                by_service = []
            
            # Évolution temporelle (par mois)
            evolution = []
            try:
                from django.db import connection
                # Pour SQLite
                if 'sqlite' in connection.vendor:
                    evolution_data = queryset.extra(
                        select={'month': "strftime('%%Y-%%m', accident_date)"}
                    ).values('month').annotate(count=Count('id')).order_by('month')
                    for item in evolution_data:
                        evolution.append({
                            'month': item.get('month', ''),
                            'count': item.get('count', 0)
                        })
                else:
                    # Pour PostgreSQL/MySQL
                    from django.db.models.functions import TruncMonth
                    evolution_data = queryset.annotate(
                        month=TruncMonth('accident_date')
                    ).values('month').annotate(count=Count('id')).order_by('month')
                    for item in evolution_data:
                        evolution.append({
                            'month': str(item.get('month', '')),
                            'count': item.get('count', 0)
                        })
            except Exception as e:
                # En cas d'erreur, on retourne une liste vide
                import logging
                logger = logging.getLogger(__name__)
                logger.error(f"Erreur lors du calcul de l'évolution: {e}")
                evolution = []
            
            stats = {
                'total': total,
                'by_type': by_type,
                'by_severity': by_severity,
                'by_status': by_status,
                'with_work_stoppage': with_work_stoppage,
                'total_work_stoppage_days': total_work_stoppage_days,
                'by_company': by_company,
                'by_site': by_site,
                'by_service': by_service,
                'evolution': evolution,
            }
            
            return Response(stats)
        except Exception as e:
            # Retourner des statistiques vides en cas d'erreur
            import logging
            import traceback
            logger = logging.getLogger(__name__)
            logger.error(f"Erreur lors du calcul des statistiques: {e}")
            logger.error(traceback.format_exc())
            return Response({
                'total': 0,
                'by_type': {},
                'by_severity': {},
                'by_status': {},
                'with_work_stoppage': 0,
                'total_work_stoppage_days': 0,
                'by_company': [],
                'by_site': [],
                'by_service': [],
                'evolution': [],
            })
    
    @action(detail=False, methods=['get'])
    def frequent_causes(self, request):
        """Causes fréquentes des accidents"""
        queryset = self.get_queryset()
        
        # Analyse des causes racines (simple analyse de texte)
        # Dans une vraie application, on utiliserait un système de catégorisation
        causes = {}
        for accident in queryset.filter(root_causes__isnull=False)[:100]:
            if accident.root_causes:
                # Simple comptage par mots-clés (à améliorer)
                for word in accident.root_causes.lower().split():
                    if len(word) > 4:  # Ignorer les mots courts
                        causes[word] = causes.get(word, 0) + 1
        
        # Trier et retourner les 10 plus fréquentes
        frequent = sorted(causes.items(), key=lambda x: x[1], reverse=True)[:10]
        
        return Response({'causes': [{'word': word, 'count': count} for word, count in frequent]})
    
    @action(detail=False, methods=['get'])
    def alerts(self, request):
        """Liste des accidents nécessitant une alerte"""
        role = request.user.role
        
        queryset = self.get_queryset()
        
        if role == 'rh':
            queryset = queryset.filter(alert_rh=True)
        elif role == 'hse':
            queryset = queryset.filter(alert_hse=True)
        elif role == 'direction':
            queryset = queryset.filter(alert_direction=True)
        else:
            queryset = queryset.filter(Q(alert_rh=True) | Q(alert_hse=True) | Q(alert_direction=True))
        
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)


class OccupationalDiseaseViewSet(viewsets.ModelViewSet):
    """
    ViewSet pour la gestion des maladies professionnelles
    Accessible par: Médecin, RH, HSE, Direction (lecture)
    """
    queryset = OccupationalDisease.objects.select_related('agent', 'declared_by').all()
    serializer_class = OccupationalDiseaseSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['agent', 'disease_type', 'status', 'agent__company', 'agent__site']
    search_fields = ['agent__matricule', 'agent__last_name', 'disease_name']
    ordering_fields = ['first_symptoms_date', 'diagnosis_date', 'declaration_date', 'created_at']
    ordering = ['-first_symptoms_date']
    
    def get_queryset(self):
        """Filtre selon les permissions"""
        queryset = super().get_queryset()
        
        # Filtrage par entreprise si l'utilisateur n'est pas super_admin
        if hasattr(self.request, 'user') and self.request.user.role != 'super_admin':
            user_companies = self.request.user.company_memberships.values_list('company_id', flat=True)
            if user_companies:
                queryset = queryset.filter(agent__company_id__in=user_companies)
        
        return queryset
    
    def perform_create(self, serializer):
        serializer.save(declared_by=self.request.user)
    
    @action(detail=False, methods=['get'])
    def statistics(self, request):
        """Statistiques sur les maladies professionnelles"""
        queryset = self.get_queryset()
        
        stats = {
            'total': queryset.count(),
            'by_status': dict(queryset.values('status').annotate(count=Count('id')).values_list('status', 'count')),
            'by_disease': list(queryset.values('disease_name').annotate(count=Count('id')).values('disease_name', 'count')[:10]),
            'by_company': list(queryset.values('agent__company__name').annotate(count=Count('id')).values('agent__company__name', 'count')),
            'recognized': queryset.filter(status='recognized').count(),
            'pending': queryset.filter(status='declared').count(),
        }
        
        return Response(stats)
