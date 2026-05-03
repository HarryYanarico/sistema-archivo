"""
Seed script: crea grupos base y les asigna permisos por defecto.
Ejecutar: python manage.py runscript seed_data
o directamente: python manage.py shell < seed_data.py
"""
from django.contrib.auth.models import Group, Permission
from django.contrib.contenttypes.models import ContentType
from django.contrib.auth.models import User
from api.models import (
    Carpeta, Documento, Prestamo, Prorroga,
    Incidente, DetalleIncidente, Bloqueo,
    Persona, Ambiente, Estante, Piso,
)

def run():
    print("Creando grupos base...")

    admin_group, _ = Group.objects.get_or_create(name="Administrador")
    admin_group.permissions.set(Permission.objects.all())
    print(f"  [OK] Administrador - todos los permisos")

    admin_group, _ = Group.objects.get_or_create(name="Administrativo")
    model_perms = Permission.objects.filter(content_type__app_label='api')
    admin_group.permissions.set(model_perms)
    print(f"  [OK] Administrativo - permisos de api")

    op_group, _ = Group.objects.get_or_create(name="Operador")
    limited_perms = Permission.objects.filter(
        content_type__app_label='api',
        codename__in=[
            'view_carpeta', 'add_carpeta',
            'view_documento', 'add_documento',
            'view_prestamo', 'add_prestamo', 'change_prestamo',
            'view_incidente', 'add_incidente',
            'view_prorroga', 'add_prorroga',
            'view_persona',
            'view_ambiente', 'view_estante', 'view_piso',
        ]
    )
    op_group.permissions.set(limited_perms)
    print(f"  [OK] Operador - permisos limitados")

    print("\nGrupos creados exitosamente.")
