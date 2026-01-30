from django.contrib import admin
from .models import TrainingType, Training, EducationalArticle, ArticleRecipient, TrainingRequirement


@admin.register(TrainingType)
class TrainingTypeAdmin(admin.ModelAdmin):
    list_display = ['name', 'code', 'validity_period_months', 'is_active']
    list_filter = ['is_active']
    search_fields = ['name', 'code']


@admin.register(Training)
class TrainingAdmin(admin.ModelAdmin):
    list_display = ['agent', 'training_type', 'start_date', 'status', 'result', 'created_by', 'created_at']
    list_filter = ['training_type', 'status', 'start_date']
    search_fields = ['agent__matricule', 'agent__last_name', 'training_type__name']
    date_hierarchy = 'start_date'


@admin.register(EducationalArticle)
class EducationalArticleAdmin(admin.ModelAdmin):
    list_display = ['title', 'theme', 'target_audience', 'is_published', 'author', 'created_at']
    list_filter = ['theme', 'target_audience', 'is_published', 'created_at']
    search_fields = ['title', 'content', 'theme']
    date_hierarchy = 'created_at'


@admin.register(ArticleRecipient)
class ArticleRecipientAdmin(admin.ModelAdmin):
    list_display = ['article', 'agent', 'read', 'read_date']
    list_filter = ['read', 'read_date']
    search_fields = ['article__title', 'agent__matricule', 'agent__last_name']


@admin.register(TrainingRequirement)
class TrainingRequirementAdmin(admin.ModelAdmin):
    list_display = ['training_type', 'job_position', 'mandatory']
    list_filter = ['mandatory', 'training_type']
    search_fields = ['training_type__name', 'job_position__name']
    raw_id_fields = ['training_type', 'job_position']
