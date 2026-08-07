from django.db import migrations

def add_consultation_visit_type(apps, schema_editor):
    VisitType = apps.get_model('visits', 'VisitType')
    VisitType.objects.get_or_create(
        name='Consultation',
        defaults={
            'code': 'consultation',
            'description': "Visite pour consultation médicale à la demande de l'agent",
            'is_active': True,
        },
    )

def remove_consultation_visit_type(apps, schema_editor):
    VisitType = apps.get_model('visits', 'VisitType')
    VisitType.objects.filter(name='Consultation').delete()

class Migration(migrations.Migration):
    dependencies = [
        ('visits', '0003_alter_medicalvisit_avis_and_more'),
    ]
    operations = [
        migrations.RunPython(add_consultation_visit_type, remove_consultation_visit_type),
    ]
