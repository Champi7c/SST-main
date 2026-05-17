from django.db import migrations, models
import django.db.models.deletion
from django.conf import settings


class Migration(migrations.Migration):

    dependencies = [
        ('medical', '0007_alter_agent_hire_date_alter_agent_matricule'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='MedicalResult',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('result_type', models.CharField(
                    choices=[
                        ('biologique', 'Analyses biologiques'),
                        ('radiologie', 'Radiologie / Imagerie'),
                        ('ecg', 'ECG / Cardiologie'),
                        ('audiometrie', 'Audiométrie'),
                        ('spirometrie', 'Spirométrie / EFR'),
                        ('visuel', 'Acuité visuelle'),
                        ('toxicologie', 'Toxicologie'),
                        ('autre', 'Autre'),
                    ],
                    default='biologique',
                    max_length=50,
                    verbose_name="Type d'examen",
                )),
                ('title', models.CharField(max_length=255, verbose_name="Intitulé de l'examen")),
                ('exam_date', models.DateField(verbose_name="Date de l'examen")),
                ('result_value', models.TextField(verbose_name='Résultat')),
                ('normal_range', models.CharField(blank=True, max_length=255, null=True, verbose_name='Valeurs de référence')),
                ('interpretation', models.TextField(blank=True, null=True, verbose_name='Interprétation / Conclusion')),
                ('performed_by', models.CharField(blank=True, max_length=255, null=True, verbose_name='Réalisé par (labo / technicien)')),
                ('is_abnormal', models.BooleanField(default=False, verbose_name='Résultat anormal')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('agent', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='medical_results', to='medical.agent', verbose_name='Agent')),
                ('created_by', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='medical_results_created', to=settings.AUTH_USER_MODEL, verbose_name='Créé par')),
            ],
            options={
                'verbose_name': 'Résultat médical',
                'verbose_name_plural': 'Résultats médicaux',
                'ordering': ['-exam_date', '-created_at'],
            },
        ),
    ]
