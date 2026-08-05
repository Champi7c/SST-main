"""
Serializers pour les utilisateurs
"""
from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
from django.contrib.auth.models import Permission
from .models import User


class PermissionSerializer(serializers.ModelSerializer):
    """Serializer pour les permissions Django (granularité par action/module)"""
    app_label = serializers.CharField(source='content_type.app_label', read_only=True)
    model = serializers.CharField(source='content_type.model', read_only=True)
    full_code = serializers.SerializerMethodField()

    class Meta:
        model = Permission
        fields = ['id', 'name', 'codename', 'app_label', 'model', 'full_code']

    def get_full_code(self, obj):
        return f"{obj.content_type.app_label}.{obj.codename}"


class UserSerializer(serializers.ModelSerializer):
    """Serializer pour les utilisateurs"""
    full_name = serializers.SerializerMethodField()
    role_display = serializers.SerializerMethodField()
    permissions = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name',
            'full_name', 'role', 'role_display', 'phone', 'is_active',
            'is_superuser', 'permissions', 'date_joined', 'last_login'
        ]
        read_only_fields = ['id', 'date_joined', 'last_login']

    def get_full_name(self, obj):
        return obj.get_full_name() or f"{obj.first_name} {obj.last_name}".strip() or obj.username

    def get_role_display(self, obj):
        if hasattr(obj, 'role') and obj.role:
            return obj.get_role_display()
        return 'Non défini'

    def get_permissions(self, obj):
        return [
            f"{p.content_type.app_label}.{p.codename}"
            for p in obj.user_permissions.select_related('content_type').all()
        ]


class UserCreateSerializer(serializers.ModelSerializer):
    """Serializer pour la création d'utilisateurs"""
    password = serializers.CharField(write_only=True, validators=[validate_password])
    password_confirm = serializers.CharField(write_only=True)
    permission_ids = serializers.PrimaryKeyRelatedField(
        source='user_permissions', queryset=Permission.objects.all(),
        many=True, required=False, write_only=True
    )

    class Meta:
        model = User
        fields = [
            'username', 'email', 'password', 'password_confirm',
            'first_name', 'last_name', 'role', 'phone', 'is_superuser',
            'permission_ids'
        ]

    def validate(self, attrs):
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError({"password": "Les mots de passe ne correspondent pas."})
        request = self.context.get('request')
        if attrs.get('is_superuser') and request and not (
            request.user.is_superuser or request.user.role == 'super_admin'
        ):
            attrs.pop('is_superuser')
        return attrs

    def create(self, validated_data):
        validated_data.pop('password_confirm')
        password = validated_data.pop('password')
        permissions = validated_data.pop('user_permissions', [])
        user = User.objects.create_user(password=password, **validated_data)
        if permissions:
            user.user_permissions.set(permissions)
        return user


class UserUpdateSerializer(serializers.ModelSerializer):
    """Serializer pour la mise à jour d'utilisateurs"""
    permission_ids = serializers.PrimaryKeyRelatedField(
        source='user_permissions', queryset=Permission.objects.all(),
        many=True, required=False, write_only=True
    )

    class Meta:
        model = User
        fields = [
            'email', 'first_name', 'last_name', 'role', 'phone', 'is_active',
            'is_superuser', 'permission_ids'
        ]

    def validate(self, attrs):
        request = self.context.get('request')
        if 'is_superuser' in attrs and request and not (
            request.user.is_superuser or request.user.role == 'super_admin'
        ):
            attrs.pop('is_superuser')
        return attrs

    def update(self, instance, validated_data):
        permissions = validated_data.pop('user_permissions', None)
        instance = super().update(instance, validated_data)
        if permissions is not None:
            instance.user_permissions.set(permissions)
        return instance


class AdminResetPasswordSerializer(serializers.Serializer):
    """Serializer pour la réinitialisation du mot de passe d'un utilisateur par un admin"""
    new_password = serializers.CharField(required=True, validators=[validate_password])
    new_password_confirm = serializers.CharField(required=True)

    def validate(self, attrs):
        if attrs['new_password'] != attrs['new_password_confirm']:
            raise serializers.ValidationError({"new_password": "Les mots de passe ne correspondent pas."})
        return attrs


class ChangePasswordSerializer(serializers.Serializer):
    """Serializer pour le changement de mot de passe"""
    old_password = serializers.CharField(required=True)
    new_password = serializers.CharField(required=True, validators=[validate_password])
    new_password_confirm = serializers.CharField(required=True)
    
    def validate(self, attrs):
        if attrs['new_password'] != attrs['new_password_confirm']:
            raise serializers.ValidationError({"new_password": "Les mots de passe ne correspondent pas."})
        return attrs
