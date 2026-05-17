from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('companies', '0001_initial'),
    ]

    operations = [
        migrations.CreateModel(
            name='Doctor',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('last_name', models.CharField(max_length=100, verbose_name='Nom')),
                ('first_name', models.CharField(max_length=100, verbose_name='Prénom')),
                ('specialty', models.CharField(blank=True, max_length=200, null=True, verbose_name='Spécialité')),
                ('phone', models.CharField(blank=True, max_length=20, null=True, verbose_name='Téléphone')),
                ('email', models.EmailField(blank=True, max_length=254, null=True, verbose_name='Email')),
                ('is_active', models.BooleanField(default=True, verbose_name='Actif')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('company', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='doctors', to='companies.company', verbose_name='Entreprise')),
            ],
            options={
                'verbose_name': 'Médecin',
                'verbose_name_plural': 'Médecins',
                'ordering': ['last_name', 'first_name'],
            },
        ),
    ]
