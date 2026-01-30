"""
Permissions pour le reporting SST.
Accès par profil : DG, RH, HSE, Médecin (vue complète).
"""
from rest_framework import permissions


class IsReportingProfile(permissions.BasePermission):
    """
    Accès aux tableaux de bord et indicateurs :
    Direction, RH, HSE, Médecin, Admin, Super Admin, Consultant.
    """
    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated):
            return False
        return request.user.role in [
            'super_admin', 'admin', 'direction', 'rh', 'hse',
            'medecin', 'infirmier', 'consultant',
        ]


class IsMedicalReportingProfile(permissions.BasePermission):
    """
    Vue complète (indicateurs santé, rapports détaillés) :
    Médecin, Infirmier, Super Admin uniquement.
    """
    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated):
            return False
        return request.user.role in ['super_admin', 'medecin', 'infirmier']
