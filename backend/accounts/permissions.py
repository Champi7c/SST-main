"""
Permissions personnalisées pour l'application SST
"""
from rest_framework import permissions


class IsSuperAdminOrAdmin(permissions.BasePermission):
    """Permission pour super admin ou admin"""
    def has_permission(self, request, view):
        return (
            request.user and
            request.user.is_authenticated and
            request.user.role in ['super_admin', 'admin']
        )


class IsMedicalStaff(permissions.BasePermission):
    """Permission pour le personnel médical"""
    def has_permission(self, request, view):
        return (
            request.user and
            request.user.is_authenticated and
            request.user.has_medical_access
        )


class CanManageUsers(permissions.BasePermission):
    """Permission pour gérer les utilisateurs"""
    def has_permission(self, request, view):
        return (
            request.user and
            request.user.is_authenticated and
            request.user.can_manage_users
        )


class CanViewMedicalData(permissions.BasePermission):
    """Permission pour voir les données médicales"""
    def has_permission(self, request, view):
        return (
            request.user and
            request.user.is_authenticated and
            request.user.has_medical_access
        )


class CanViewDashboard(permissions.BasePermission):
    """Permission pour voir le tableau de bord"""
    def has_permission(self, request, view):
        return (
            request.user and
            request.user.is_authenticated and
            request.user.can_view_dashboard
        )


class CanManageAgents(permissions.BasePermission):
    """Permission pour gérer les agents (Admin, RH, HSE, Médecin, Infirmier, Direction)"""
    def has_permission(self, request, view):
        return (
            request.user and
            request.user.is_authenticated and
            request.user.role in ['super_admin', 'admin', 'rh', 'hse', 'medecin', 'infirmier', 'direction']
        )