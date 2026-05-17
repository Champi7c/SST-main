from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('medical', '0008_medicalresult'),
    ]

    operations = [
        migrations.AddField(
            model_name='medicalresult',
            name='pdf_file',
            field=models.FileField(blank=True, null=True, upload_to='medical_results/', verbose_name='Fichier PDF'),
        ),
    ]
