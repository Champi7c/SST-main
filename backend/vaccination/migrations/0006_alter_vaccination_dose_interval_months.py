from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('vaccination', '0005_vaccination_status'),
    ]

    operations = [
        migrations.AlterField(
            model_name='vaccination',
            name='dose_interval_months',
            field=models.IntegerField(default=1, verbose_name='Intervalle entre doses (mois)'),
        ),
    ]
