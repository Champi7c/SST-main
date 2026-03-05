"""
Consultations en ligne — rendez-vous visio type Meet/Teams avec lien unique.
"""
import uuid
from django.db import models
from django.conf import settings
from medical.models import Agent


def generate_meeting_id():
    return f"sst-{uuid.uuid4().hex[:12]}"


class OnlineConsultation(models.Model):
    """
    Consultation en ligne : un lien unique (Jitsi Meet) est généré et peut être
    envoyé à l'agent pour rejoindre la visioconférence avec webcam.
    """
    STATUS_CHOICES = [
        ('pending', 'En attente'),
        ('scheduled', 'Programmée'),
        ('in_progress', 'En cours'),
        ('completed', 'Terminée'),
        ('cancelled', 'Annulée'),
    ]

    agent = models.ForeignKey(
        Agent,
        on_delete=models.CASCADE,
        related_name='online_consultations',
        verbose_name='Agent',
        null=True,
        blank=True,
    )
    requested_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='consultations_requested',
        verbose_name='Demandé par',
    )
    subject = models.CharField(max_length=255, verbose_name='Sujet')
    message = models.TextField(blank=True, null=True, verbose_name='Message / précisions')
    preferred_date = models.DateField(blank=True, null=True, verbose_name='Date souhaitée')
    preferred_time = models.CharField(max_length=100, blank=True, null=True, verbose_name='Créneau souhaité')

    # Lien de la visio (type Jitsi Meet)
    meeting_id = models.CharField(
        max_length=50,
        unique=True,
        default=generate_meeting_id,
        editable=False,
        verbose_name='ID de la salle',
    )
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='pending',
        verbose_name='Statut',
    )
    scheduled_at = models.DateTimeField(blank=True, null=True, verbose_name='Date et heure programmées')

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Consultation en ligne'
        verbose_name_plural = 'Consultations en ligne'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.subject} — {self.meeting_id}"

    @property
    def meeting_link(self):
        """Lien Jitsi Meet pour rejoindre la consultation (webcam, micro)."""
        return f"https://meet.jit.si/{self.meeting_id}"
