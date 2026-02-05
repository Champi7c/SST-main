from rest_framework import serializers
from django.db import models
from .models import Agent, DMST, Pathology, AgentPathology, DMSTHistory
from companies.serializers import CompanySerializer, SiteSerializer, ServiceSerializer, JobPositionSerializer
from companies.models import Company


class AgentSerializer(serializers.ModelSerializer):
    company_name = serializers.CharField(source='company.name', read_only=True)
    site_name = serializers.CharField(source='site.name', read_only=True, allow_null=True)
    service_name = serializers.CharField(source='service.name', read_only=True, allow_null=True)
    job_position_name = serializers.CharField(source='job_position.name', read_only=True, allow_null=True)
    supervisor_name = serializers.SerializerMethodField()
    supervisor_matricule = serializers.CharField(source='supervisor.matricule', read_only=True, allow_null=True)
    full_name = serializers.SerializerMethodField()
    age = serializers.ReadOnlyField()
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True, allow_null=True)
    updated_by_name = serializers.CharField(source='updated_by.get_full_name', read_only=True, allow_null=True)
    archived_by_name = serializers.CharField(source='archived_by.get_full_name', read_only=True, allow_null=True)
    # Champs pour accepter des noms au lieu d'IDs
    company_name_input = serializers.CharField(write_only=True, required=False, allow_blank=True)
    site_name_input = serializers.CharField(write_only=True, required=False, allow_blank=True)
    service_name_input = serializers.CharField(write_only=True, required=False, allow_blank=True)
    job_position_name_input = serializers.CharField(write_only=True, required=False, allow_blank=True)
    supervisor_matricule_input = serializers.CharField(write_only=True, required=False, allow_blank=True)
    # Définir explicitement le champ company avec un queryset valide
    company = serializers.PrimaryKeyRelatedField(queryset=Company.objects.all(), required=False, allow_null=True)
    
    class Meta:
        model = Agent
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at', 'archived_at', 'created_by', 'updated_by', 'archived_by']
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # Rendre company optionnel pour permettre la validation personnalisée
        # Le champ company est créé automatiquement par DRF, on le modifie ici
        if 'company' in self.fields:
            self.fields['company'].required = False
            self.fields['company'].allow_null = True
    
    def get_full_name(self, obj):
        return f"{obj.last_name} {obj.first_name}"
    
    def get_supervisor_name(self, obj):
        if obj.supervisor:
            return f"{obj.supervisor.last_name} {obj.supervisor.first_name}"
        return None
    
    def validate(self, attrs):
        """Valide que soit company soit company_name_input est fourni"""
        company = attrs.get('company')
        company_name_input = attrs.get('company_name_input', '').strip()
        
        # Si company est un ID (int), DRF le convertira automatiquement en objet
        # Mais dans validate(), c'est encore un ID, donc on doit le gérer
        company_obj = None
        if company:
            # Si c'est déjà un objet Company, l'utiliser
            if hasattr(company, 'id'):
                company_obj = company
            else:
                # Sinon, c'est probablement un ID, DRF le convertira plus tard
                # On va juste vérifier qu'il existe
                from companies.models import Company
                try:
                    company_obj = Company.objects.get(pk=company)
                except Company.DoesNotExist:
                    raise serializers.ValidationError({
                        'company': f'L\'entreprise avec l\'ID {company} n\'existe pas.'
                    })
        
        if not company_obj and not company_name_input:
            raise serializers.ValidationError({
                'company': 'Vous devez fournir soit un ID d\'entreprise, soit un nom d\'entreprise.'
            })
        
        # Si company_name_input est fourni, créer ou récupérer l'entreprise
        if company_name_input and not company_obj:
            from companies.models import Company
            # Chercher si l'entreprise existe déjà (insensible à la casse)
            company_obj = Company.objects.filter(name__iexact=company_name_input).first()
            
            if not company_obj:
                # Créer une nouvelle entreprise avec un SIRET temporaire
                # Le SIRET sera généré en utilisant un format temporaire basé sur le timestamp
                import time
                import random
                timestamp = str(int(time.time()))[-10:]  # 10 derniers chiffres du timestamp
                random_part = str(random.randint(1000, 9999))
                temp_siret = f"{timestamp}{random_part}"[:14]  # SIRET doit faire 14 caractères max
                # S'assurer que le SIRET est unique
                while Company.objects.filter(siret=temp_siret).exists():
                    random_part = str(random.randint(1000, 9999))
                    temp_siret = f"{timestamp}{random_part}"[:14]
                
                company_obj = Company.objects.create(
                    name=company_name_input,
                    siret=temp_siret,
                    address="À compléter",
                    is_active=True
                )
            
            attrs['company'] = company_obj
            # Retirer company_name_input des validated_data car il n'est pas un champ du modèle
            attrs.pop('company_name_input', None)
        
        # S'assurer que company_obj est défini à la fin
        company_obj = attrs.get('company')
        if not company_obj:
            # Si company est un ID, essayer de le récupérer
            company_id = attrs.get('company')
            if company_id:
                from companies.models import Company
                try:
                    company_obj = Company.objects.get(pk=company_id)
                    attrs['company'] = company_obj
                except Company.DoesNotExist:
                    raise serializers.ValidationError({
                        'company': f'L\'entreprise avec l\'ID {company_id} n\'existe pas.'
                    })
        
        # Vérification finale : company doit être défini
        if not attrs.get('company'):
            raise serializers.ValidationError({
                'company': 'L\'entreprise est requise.'
            })
        
        # Gérer le site
        site = attrs.get('site')
        site_name_input = attrs.get('site_name_input', '').strip()
        
        if site_name_input and not site and company_obj:
            from companies.models import Site
            # Chercher si le site existe déjà pour cette entreprise
            site_obj = Site.objects.filter(company=company_obj, name__iexact=site_name_input).first()
            
            if not site_obj:
                # Créer un nouveau site
                site_obj = Site.objects.create(
                    company=company_obj,
                    name=site_name_input,
                    address="À compléter",
                    is_active=True
                )
            
            attrs['site'] = site_obj
            attrs.pop('site_name_input', None)
        
        # Gérer le service
        service = attrs.get('service')
        service_name_input = attrs.get('service_name_input', '').strip()
        site_obj = attrs.get('site')
        
        if service_name_input and not service and company_obj:
            from companies.models import Service
            # Chercher si le service existe déjà pour cette entreprise
            service_obj = Service.objects.filter(company=company_obj, name__iexact=service_name_input).first()
            
            if not service_obj:
                # Créer un nouveau service
                service_obj = Service.objects.create(
                    company=company_obj,
                    site=site_obj if site_obj else None,
                    name=service_name_input,
                    is_active=True
                )
            
            attrs['service'] = service_obj
            attrs.pop('service_name_input', None)
        
        # Gérer le poste de travail
        job_position = attrs.get('job_position')
        job_position_name_input = attrs.get('job_position_name_input', '').strip()
        
        if job_position_name_input and not job_position and company_obj:
            from companies.models import JobPosition
            # Chercher si le poste existe déjà pour cette entreprise
            job_position_obj = JobPosition.objects.filter(company=company_obj, name__iexact=job_position_name_input).first()
            
            if not job_position_obj:
                # Créer un nouveau poste de travail
                job_position_obj = JobPosition.objects.create(
                    company=company_obj,
                    name=job_position_name_input,
                    is_active=True
                )
            
            attrs['job_position'] = job_position_obj
            attrs.pop('job_position_name_input', None)
        
        # Gérer le superviseur (recherche par matricule ou nom)
        supervisor = attrs.get('supervisor')
        supervisor_matricule_input = attrs.get('supervisor_matricule_input', '').strip()
        company_obj = attrs.get('company')
        
        if supervisor_matricule_input and not supervisor and company_obj:
            from .models import Agent
            # Chercher par matricule d'abord
            supervisor_obj = Agent.objects.filter(
                company=company_obj,
                matricule__iexact=supervisor_matricule_input,
                is_archived=False
            ).first()
            
            # Si pas trouvé par matricule, chercher par nom
            if not supervisor_obj:
                # Le format peut être "Nom Prénom" ou "Prénom Nom"
                name_parts = supervisor_matricule_input.split()
                if len(name_parts) >= 2:
                    # Essayer les deux ordres possibles
                    supervisor_obj = Agent.objects.filter(
                        company=company_obj,
                        is_archived=False
                    ).filter(
                        models.Q(first_name__icontains=name_parts[0], last_name__icontains=name_parts[-1]) |
                        models.Q(first_name__icontains=name_parts[-1], last_name__icontains=name_parts[0])
                    ).first()
                else:
                    # Chercher dans le prénom ou le nom
                    supervisor_obj = Agent.objects.filter(
                        company=company_obj,
                        is_archived=False
                    ).filter(
                        models.Q(first_name__icontains=supervisor_matricule_input) |
                        models.Q(last_name__icontains=supervisor_matricule_input)
                    ).first()
            
            if supervisor_obj:
                attrs['supervisor'] = supervisor_obj
            
            attrs.pop('supervisor_matricule_input', None)
        
        return attrs
    
    def create(self, validated_data):
        """Création d'un agent avec enregistrement de l'utilisateur créateur"""
        # Retirer les champs _name_input s'ils sont encore présents
        validated_data.pop('company_name_input', None)
        validated_data.pop('site_name_input', None)
        validated_data.pop('service_name_input', None)
        validated_data.pop('job_position_name_input', None)
        validated_data.pop('supervisor_matricule_input', None)
        request = self.context.get('request')
        if request and request.user:
            validated_data['created_by'] = request.user
            validated_data['updated_by'] = request.user
        return super().create(validated_data)
    
    def update(self, instance, validated_data):
        """Mise à jour d'un agent avec enregistrement de l'utilisateur modificateur"""
        # Retirer les champs _name_input s'ils sont encore présents
        validated_data.pop('company_name_input', None)
        validated_data.pop('site_name_input', None)
        validated_data.pop('service_name_input', None)
        validated_data.pop('job_position_name_input', None)
        validated_data.pop('supervisor_matricule_input', None)
        request = self.context.get('request')
        if request and request.user:
            validated_data['updated_by'] = request.user
        return super().update(instance, validated_data)


class DMSTHistorySerializer(serializers.ModelSerializer):
    """Serializer pour l'historique des modifications du DMST"""
    modified_by_name = serializers.CharField(source='modified_by.get_full_name', read_only=True, allow_null=True)
    related_visit_id = serializers.IntegerField(source='related_visit.id', read_only=True, allow_null=True)
    
    class Meta:
        model = DMSTHistory
        fields = '__all__'
        read_only_fields = ['modification_date']


class DMSTSerializer(serializers.ModelSerializer):
    agent_name = serializers.SerializerMethodField()
    agent_matricule = serializers.CharField(source='agent.matricule', read_only=True)
    agent_age = serializers.IntegerField(source='agent.age', read_only=True)
    agent_direction = serializers.CharField(source='agent.company.name', read_only=True)
    agent_function = serializers.CharField(source='agent.function', read_only=True, allow_null=True)
    agent_site_name = serializers.CharField(source='agent.site.name', read_only=True, allow_null=True)
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True, allow_null=True)
    updated_by_name = serializers.CharField(source='updated_by.get_full_name', read_only=True, allow_null=True)
    visits_count = serializers.SerializerMethodField()
    last_visit_date = serializers.SerializerMethodField()
    history_count = serializers.SerializerMethodField()
    
    def get_agent_name(self, obj):
        return f"{obj.agent.last_name} {obj.agent.first_name}"
    
    def get_visits_count(self, obj):
        """Nombre total de visites médicales"""
        return obj.agent.visits.count()
    
    def get_last_visit_date(self, obj):
        """Date de la dernière visite médicale"""
        last_visit = obj.agent.visits.order_by('-scheduled_date').first()
        return last_visit.scheduled_date if last_visit else None
    
    def get_history_count(self, obj):
        """Nombre d'entrées dans l'historique"""
        return obj.history.count()
    
    class Meta:
        model = DMST
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at', 'created_by', 'updated_by']


class PathologySerializer(serializers.ModelSerializer):
    class Meta:
        model = Pathology
        fields = '__all__'


class AgentPathologySerializer(serializers.ModelSerializer):
    agent_name = serializers.SerializerMethodField()
    pathology_name = serializers.CharField(source='pathology.name', read_only=True)
    pathology_code = serializers.CharField(source='pathology.code', read_only=True)
    
    def get_agent_name(self, obj):
        return f"{obj.agent.last_name} {obj.agent.first_name}"
    
    class Meta:
        model = AgentPathology
        fields = '__all__'
