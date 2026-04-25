import os
import django
import datetime

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from api.models import (
    Ambiente, Estante, Piso, Estudiante, Carpeta, Autoridad, 
    Solicitante, Prestamo, Rol, UsuarioRol
)
from django.contrib.auth.models import User

def seed_data():
    print("Creando datos de prueba...")

    # 1. Crear Usuarios y Roles
    rol_admin, _ = Rol.objects.get_or_create(nombre_rol="administrador", descripcion="Admin")
    rol_oper, _ = Rol.objects.get_or_create(nombre_rol="administrativo", descripcion="Operador")

    u_admin, _ = User.objects.get_or_create(username="admin", defaults={"email": "admin@test.com"})
    u_admin.set_password("admin123")
    u_admin.save()
    UsuarioRol.objects.get_or_create(usuario=u_admin, rol=rol_admin)

    u_oper, _ = User.objects.get_or_create(username="operador", defaults={"email": "operador@test.com"})
    u_oper.set_password("oper123")
    u_oper.save()
    UsuarioRol.objects.get_or_create(usuario=u_oper, rol=rol_oper)

    # 2. Crear Autoridad
    aut1, _ = Autoridad.objects.get_or_create(
        nombre_completo="Dra. Ana Lopez",
        cargo="Directora de Archivo",
        area="Direccion",
        email="ana@test.com"
    )

    # 3. Crear Ubicaciones (Ambiente -> Estante -> Piso)
    amb1, _ = Ambiente.objects.get_or_create(nombre="Depósito Principal", descripcion="Planta baja")
    
    est1, _ = Estante.objects.get_or_create(codigo="EST-01", ambiente=amb1)
    
    piso1, _ = Piso.objects.get_or_create(numero=1, estante=est1)
    piso2, _ = Piso.objects.get_or_create(numero=2, estante=est1)

    # 4. Crear Estudiantes
    estud1, _ = Estudiante.objects.get_or_create(
        codigo="20230001",
        nombre_completo="Juan Perez",
        carrera="Ingenieria de Sistemas"
    )
    estud2, _ = Estudiante.objects.get_or_create(
        codigo="20230002",
        nombre_completo="Maria Gomez",
        carrera="Medicina"
    )

    # 5. Crear Carpetas
    carp1, _ = Carpeta.objects.get_or_create(
        codigo_carpeta="CARP-001",
        estudiante=estud1,
        piso=piso1,
        estado="disponible"
    )
    carp2, _ = Carpeta.objects.get_or_create(
        codigo_carpeta="CARP-002",
        estudiante=estud2,
        piso=piso2,
        estado="prestada"
    )

    # 6. Crear Solicitante
    solic1, _ = Solicitante.objects.get_or_create(
        tipo="estudiante",
        nombre_completo=estud2.nombre_completo,
        identificacion=estud2.codigo,
        estudiante_referencia=estud2
    )

    # 7. Crear Prestamo (para la carpeta 2)
    Prestamo.objects.get_or_create(
        carpeta=carp2,
        usuario=u_oper,
        autoridad=aut1,
        solicitante=solic1,
        fecha_prestamo=datetime.date.today(),
        fecha_limite_devolucion=datetime.date.today() + datetime.timedelta(days=7),
        estado="activo"
    )

    print("Datos creados exitosamente!")

if __name__ == "__main__":
    seed_data()
