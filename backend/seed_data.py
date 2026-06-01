"""
Seed script: crea datos de prueba completos.
Ejecutar: python manage.py shell < seed_data.py
"""
import datetime
from django.contrib.auth.models import Group, Permission, User
from api.models import (
    Carpeta, Prestamo, PrestamoCarpeta, Bloqueo,
    Persona, Ambiente, Estante, Piso,
)


def run():
    print("Creando datos de prueba...")

    # ---- GRUPOS ----
    admin_group, _ = Group.objects.get_or_create(name="Administrador")
    admin_group.permissions.set(Permission.objects.all())
    print("  [OK] Administrador - todos los permisos")

    arch_group, _ = Group.objects.get_or_create(name="Archivista")
    arch_perms = Permission.objects.filter(
        content_type__app_label='api',
        codename__in=[
            'gestionar_carpetas', 'gestionar_documentos',
            'gestionar_prestamos', 'gestionar_devoluciones', 'gestionar_traspasos',
            'gestionar_ubicaciones', 'gestionar_personas', 'gestionar_bloqueos',
            'gestionar_prorrogas',
            'ver_dashboard',
        ]
    )
    arch_group.permissions.set(arch_perms)
    print("  [OK] Archivista - carpetas, docs, préstamos, devoluciones, traspasos, ubicaciones, personas, bloqueos, prórrogas, dashboard")

    op_group, _ = Group.objects.get_or_create(name="Operador")
    op_perms = Permission.objects.filter(
        content_type__app_label='api',
        codename__in=[
            'gestionar_carpetas',
            'gestionar_prestamos',
            'gestionar_devoluciones',
            'gestionar_personas',
        ]
    )
    op_group.permissions.set(op_perms)
    print("  [OK] Operador - carpetas, préstamos, devoluciones, personas")

    consultor_group, _ = Group.objects.get_or_create(name="Consultor")
    consultor_perms = Permission.objects.filter(
        content_type__app_label='api',
        codename__in=[
            'ver_dashboard',
        ]
    )
    consultor_group.permissions.set(consultor_perms)
    print("  [OK] Consultor - solo dashboard")

    # ---- USUARIOS ----
    u_admin, _ = User.objects.get_or_create(username="admin", defaults={"email": "admin@test.com", "first_name": "Admin", "last_name": "Root"})
    if not u_admin.password.startswith('pbkdf2_'):
        u_admin.set_password("admin123")
        u_admin.save()
    u_admin.groups.add(admin_group)
    print("  [OK] Usuario admin/admin123 (Administrador)")

    u_oper, _ = User.objects.get_or_create(username="archivista", defaults={"email": "archivista@test.com", "first_name": "Arch", "last_name": "Ivista"})
    if not u_oper.password.startswith('pbkdf2_'):
        u_oper.set_password("arch123")
        u_oper.save()
    u_oper.groups.add(arch_group)
    print("  [OK] Usuario archivista/arch123 (Archivista)")

    u_consult, _ = User.objects.get_or_create(username="consultor", defaults={"email": "consultor@test.com", "first_name": "Con", "last_name": "Sultor"})
    if not u_consult.password.startswith('pbkdf2_'):
        u_consult.set_password("consult123")
        u_consult.save()
    u_consult.groups.add(consultor_group)
    print("  [OK] Usuario consultor/consult123 (Consultor)")

    # ---- PERSONAS ----
    p1, _ = Persona.objects.get_or_create(
        ci="1234567", defaults={
            "nombre": "Juan", "apellido": "Perez", "telefono": "77123456",
            "email": "juan@example.com", "direccion": "Calle 1 #123", "cargo": "Jefe de Departamento"
        }
    )
    p2, _ = Persona.objects.get_or_create(
        ci="7654321", defaults={
            "nombre": "Maria", "apellido": "Lopez", "telefono": "77987654",
            "email": "maria@example.com", "direccion": "Av. 2 #456", "cargo": "Secretaria"
        }
    )
    p3, _ = Persona.objects.get_or_create(
        ci="1112223", defaults={
            "nombre": "Carlos", "apellido": "Mendoza", "telefono": "77111111",
            "email": "carlos@example.com", "direccion": "Calle 3 #789"
        }
    )
    p4, _ = Persona.objects.get_or_create(
        ci="4445556", defaults={
            "nombre": "Ana", "apellido": "Rojas", "telefono": "77222222",
            "email": "ana@example.com", "direccion": "Av. 4 #101"
        }
    )
    print("  [OK] 4 personas creadas (2 con cargo)")

    # ---- UBICACIONES ----
    amb1, _ = Ambiente.objects.get_or_create(nombre="Depósito Principal", ubicacion="Planta baja", descripcion="Ambiente principal de archivo")
    amb2, _ = Ambiente.objects.get_or_create(nombre="Archivo Central", ubicacion="Primer piso", descripcion="Documentos históricos")

    est1, _ = Estante.objects.get_or_create(codigo="EST-A01", numero=1, ambiente=amb1)
    est2, _ = Estante.objects.get_or_create(codigo="EST-A02", numero=2, ambiente=amb1)
    est3, _ = Estante.objects.get_or_create(codigo="EST-B01", numero=1, ambiente=amb2)

    piso1, _ = Piso.objects.get_or_create(nro_fila=1, estante=est1)
    piso2, _ = Piso.objects.get_or_create(nro_fila=2, estante=est1)
    piso3, _ = Piso.objects.get_or_create(nro_fila=1, estante=est2)
    piso4, _ = Piso.objects.get_or_create(nro_fila=1, estante=est3)
    print("  [OK] 2 ambientes, 3 estantes, 4 pisos")

    # ---- CARPETAS ----
    carpetas = []
    c_data = [
        ("Expediente Personal 001", "disponible", piso1),
        ("Expediente Personal 002", "disponible", piso1),
        ("Documentos Contables 2024", "disponible", piso2),
        ("Legajo RRHH 001", "disponible", piso2),
        ("Historial Clínico 001", "disponible", piso3),
        ("Historial Clínico 002", "disponible", piso3),
        ("Contratos 2024", "disponible", piso4),
        ("Informes Técnicos", "disponible", piso4),
    ]
    for desc, estado, piso in c_data:
        c, _ = Carpeta.objects.get_or_create(
            descripcion=desc, piso=piso,
            defaults={"estado": estado}
        )
        carpetas.append(c)
    print(f"  [OK] {len(carpetas)} carpetas")

    # ---- PRÉSTAMOS ----
    today = datetime.date.today()

    prest1, _ = Prestamo.objects.get_or_create(
        persona=p3, usuario=u_admin, autorizado_por=p1,
        fecha_limite=today + datetime.timedelta(days=15),
        observaciones="Préstamo de expedientes personales"
    )
    if not PrestamoCarpeta.objects.filter(prestamo=prest1).exists():
        for c in carpetas[:2]:
            PrestamoCarpeta.objects.create(prestamo=prest1, carpeta=c, estado='prestado')
            c.estado = 'prestado'
            c.save()
    print("  [OK] Préstamo activo (al día)")

    prest2, _ = Prestamo.objects.get_or_create(
        persona=p4, usuario=u_oper, autorizado_por=p2,
        fecha_limite=today - datetime.timedelta(days=10),
        observaciones="Préstamo vencido - contrato 2024"
    )
    if not PrestamoCarpeta.objects.filter(prestamo=prest2).exists():
        pc = PrestamoCarpeta.objects.create(prestamo=prest2, carpeta=carpetas[6], estado='prestado')
        carpetas[6].estado = 'prestado'
        carpetas[6].save()
    print("  [OK] Préstamo vencido (10 días atrasado)")

    prest3, _ = Prestamo.objects.get_or_create(
        persona=p3, usuario=u_admin, autorizado_por=p1,
        fecha_limite=today - datetime.timedelta(days=30),
        observaciones="Préstamo muy vencido"
    )
    if not PrestamoCarpeta.objects.filter(prestamo=prest3).exists():
        PrestamoCarpeta.objects.create(prestamo=prest3, carpeta=carpetas[4], estado='prestado')
        carpetas[4].estado = 'prestado'
        carpetas[4].save()
    print("  [OK] Préstamo muy vencido (30 días atrasado)")

    bloqueo, created = Bloqueo.objects.get_or_create(
        persona=p4,
        defaults={
            "motivo_bloq": "Préstamo vencido desde el " + str(today - datetime.timedelta(days=10)) + " - no ha devuelto Contratos 2024",
            "usuario": u_admin,
        }
    )
    if created:
        print("  [OK] Bloqueo activo para Ana Rojas")

    print("\n✅ Seed completado exitosamente!")

if __name__ == "__main__":
    run()
