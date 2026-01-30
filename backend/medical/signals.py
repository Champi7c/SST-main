"""
Signals pour la gestion automatique de l'historique DMST
"""
from django.db.models.signals import post_save, pre_save
from django.dispatch import receiver
from django.utils import timezone
from .models import DMST, DMSTHistory


@receiver(pre_save, sender=DMST)
def dmst_pre_save(sender, instance, **kwargs):
    """Enregistre l'état avant modification pour détecter les changements"""
    if instance.pk:
        try:
            old_instance = DMST.objects.get(pk=instance.pk)
            instance._old_instance = old_instance
        except DMST.DoesNotExist:
            instance._old_instance = None
    else:
        instance._old_instance = None


@receiver(post_save, sender=DMST)
def dmst_post_save(sender, instance, created, **kwargs):
    """Enregistre les modifications dans l'historique"""
    from django.contrib.contenttypes.models import ContentType
    
    if created:
        # Création du DMST
        DMSTHistory.objects.create(
            dmst=instance,
            modified_by=getattr(instance, '_current_user', None),
            modification_type='create',
            reason='Création du dossier médical',
            notes='Initialisation du DMST'
        )
    else:
        # Modification du DMST
        old_instance = getattr(instance, '_old_instance', None)
        if old_instance:
            # Comparer les champs pour détecter les modifications
            fields_to_track = [
                'allergies', 'medical_history', 'chronic_diseases',
                'smoking', 'alcohol', 'drugs', 'habits_notes',
                'physical_pathologies', 'mental_pathologies', 'social_pathologies',
                'hereditary_diseases', 'handicap', 'handicap_details',
                'pregnancy', 'pregnancy_due_date',
                'current_treatments', 'treating_doctors',
                'working_conditions', 'under_surveillance', 'surveillance_type'
            ]
            
            for field in fields_to_track:
                old_value = getattr(old_instance, field, None)
                new_value = getattr(instance, field, None)
                
                if old_value != new_value:
                    DMSTHistory.objects.create(
                        dmst=instance,
                        modified_by=getattr(instance, '_current_user', None),
                        modification_type='update',
                        field_name=field,
                        old_value=str(old_value) if old_value is not None else '',
                        new_value=str(new_value) if new_value is not None else '',
                        reason=f'Modification du champ {field}'
                    )
