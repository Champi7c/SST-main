from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('vaccination', '0004_alter_vaccination_observation_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='vaccination',
            name='status',
            field=models.CharField(
                choices=[('pending', 'En attente'), ('validated', 'Validé')],
                default='pending',
                max_length=20,
                verbose_name='Statut',
            ),
        ),
    ]
