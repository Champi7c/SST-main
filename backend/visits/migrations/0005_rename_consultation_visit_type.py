from django.db import migrations


def rename_consultation_visit_type(apps, schema_editor):
    VisitType = apps.get_model('visits', 'VisitType')
    VisitType.objects.filter(code='consultation').update(name='Consultation médicale')


def revert_consultation_visit_type(apps, schema_editor):
    VisitType = apps.get_model('visits', 'VisitType')
    VisitType.objects.filter(code='consultation').update(name='Consultation')


class Migration(migrations.Migration):

    dependencies = [
        ('visits', '0004_add_consultation_visit_type'),
    ]

    operations = [
        migrations.RunPython(rename_consultation_visit_type, revert_consultation_visit_type),
    ]
