import os
import django
import datetime

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from api.models import (
    Persona, Ambiente, Estante, Piso, Carpeta, Documento, Prestamo
)
from django.contrib.auth.models import User, Group

def seed_data():
    print("Creando datos de prueba...")

    # 1. Crear Grupos (Roles)
    grupo_admin, _ = Group.objects.get_or_create(name="Administrador")
    grupo_oper, _ = Group.objects.get_or_create(name="Administrativo")

    # 2. Crear Usuarios y Personas
    u_admin, _ = User.objects.get_or_create(username="admin", defaults={"email": "admin@test.com", "first_name": "Admin", "last_name": "Root"})
    if not u_admin.password.startswith('pbkdf2_'):
        u_admin.set_password("admin123")
        u_admin.save()
    u_admin.groups.add(grupo_admin)

    p_admin, _ = Persona.objects.get_or_create(
        ci="1111111",
        defaults={"nombre": "Admin", "apellido": "Root", "usuario": u_admin}
    )

    u_oper, _ = User.objects.get_or_create(username="operador", defaults={"email": "operador@test.com", "first_name": "Oper", "last_name": "Ador"})
    if not u_oper.password.startswith('pbkdf2_'):
        u_oper.set_password("oper123")
        u_oper.save()
    u_oper.groups.add(grupo_oper)

    p_oper, _ = Persona.objects.get_or_create(
        ci="2222222",
        defaults={"nombre": "Oper", "apellido": "Ador", "usuario": u_oper}
    )

    # Persona sin usuario (ej. un estudiante o cliente externo)
    p_cliente, _ = Persona.objects.get_or_create(
        ci="3333333",
        defaults={"nombre": "Juan", "apellido": "Perez"}
    )

    # 3. Crear Ubicaciones (Ambiente -> Estante -> Piso)
    amb1, _ = Ambiente.objects.get_or_create(nombre="Depósito Principal", descripcion="Planta baja")
    
    est1, _ = Estante.objects.get_or_create(codigo="EST-01", numero=1, ambiente=amb1)
    
    piso1, _ = Piso.objects.get_or_create(nro_fila=1, estante=est1)
    piso2, _ = Piso.objects.get_or_create(nro_fila=2, estante=est1)

    # 4. Crear Carpetas
    carp1, _ = Carpeta.objects.get_or_create(
        descripcion="Carpeta de Documentos Contables",
        piso=piso1,
        estado=True
    )
    carp2, _ = Carpeta.objects.get_or_create(
        descripcion="Carpeta de Recursos Humanos",
        piso=piso2,
        estado=False
    )

    # 5. Crear Prestamo (para la carpeta 2)
    Prestamo.objects.get_or_create(
        carpeta=carp2,
        persona=p_cliente,
        fecha_limite=datetime.date.today() + datetime.timedelta(days=7),
        estado="activo"
    )

    print("Datos creados exitosamente!")

if __name__ == "__main__":
    seed_data()
