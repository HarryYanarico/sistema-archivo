import graphene
from graphene_django import DjangoObjectType
from django.contrib.auth.models import User
import datetime
from .models import (
    Rol, UsuarioRol, Estudiante, Autoridad, Ambiente, Estante, Piso,
    Carpeta, Documento, Solicitante, Prestamo, Prorroga, Bloqueo,
    IncidenteCarpeta
)

class UserType(DjangoObjectType):
    class Meta:
        model = User
        fields = ("id", "username", "first_name", "last_name", "email", "is_active")

class RolType(DjangoObjectType):
    class Meta:
        model = Rol
        fields = ("id", "nombre_rol", "descripcion")

class UsuarioRolType(DjangoObjectType):
    class Meta:
        model = UsuarioRol
        fields = ("id", "usuario", "rol", "fecha_asignacion")

class EstudianteType(DjangoObjectType):
    class Meta:
        model = Estudiante
        fields = "__all__"

class AutoridadType(DjangoObjectType):
    class Meta:
        model = Autoridad
        fields = "__all__"

class AmbienteType(DjangoObjectType):
    class Meta:
        model = Ambiente
        fields = "__all__"

class EstanteType(DjangoObjectType):
    class Meta:
        model = Estante
        fields = "__all__"

class PisoType(DjangoObjectType):
    class Meta:
        model = Piso
        fields = "__all__"

class CarpetaType(DjangoObjectType):
    class Meta:
        model = Carpeta
        fields = "__all__"

class DocumentoType(DjangoObjectType):
    class Meta:
        model = Documento
        fields = "__all__"

class SolicitanteType(DjangoObjectType):
    class Meta:
        model = Solicitante
        fields = "__all__"

class PrestamoType(DjangoObjectType):
    class Meta:
        model = Prestamo
        fields = "__all__"

class ProrrogaType(DjangoObjectType):
    class Meta:
        model = Prorroga
        fields = "__all__"

class BloqueoType(DjangoObjectType):
    class Meta:
        model = Bloqueo
        fields = "__all__"

class IncidenteCarpetaType(DjangoObjectType):
    class Meta:
        model = IncidenteCarpeta
        fields = "__all__"

# ============================
# QUERIES (Consultas)
# ============================

class Query(graphene.ObjectType):
    all_users = graphene.List(UserType)
    all_estudiantes = graphene.List(EstudianteType)
    all_carpetas = graphene.List(CarpetaType)
    all_solicitantes = graphene.List(SolicitanteType)
    all_prestamos = graphene.List(PrestamoType)

    # Buscadores básicos
    estudiante_por_codigo = graphene.Field(EstudianteType, codigo=graphene.String(required=True))
    carpeta_por_codigo = graphene.Field(CarpetaType, codigo_carpeta=graphene.String(required=True))

    def resolve_all_users(root, info):
        return User.objects.all()

    def resolve_all_estudiantes(root, info):
        return Estudiante.objects.all()

    def resolve_all_carpetas(root, info):
        return Carpeta.objects.all()

    def resolve_all_solicitantes(root, info):
        return Solicitante.objects.all()

    def resolve_all_prestamos(root, info):
        return Prestamo.objects.all()

    def resolve_estudiante_por_codigo(root, info, codigo):
        try:
            return Estudiante.objects.get(codigo=codigo)
        except Estudiante.DoesNotExist:
            return None

    def resolve_carpeta_por_codigo(root, info, codigo_carpeta):
        try:
            return Carpeta.objects.get(codigo_carpeta=codigo_carpeta)
        except Carpeta.DoesNotExist:
            return None


# ============================
# MUTATIONS (Inserciones)
# ============================

class CrearEstudiante(graphene.Mutation):
    class Arguments:
        codigo = graphene.String(required=True)
        nombre_completo = graphene.String(required=True)
        carrera = graphene.String()
        telefono = graphene.String()
        email = graphene.String()

    estudiante = graphene.Field(EstudianteType)
    success = graphene.Boolean()

    def mutate(root, info, codigo, nombre_completo, carrera=None, telefono=None, email=None):
        estudiante = Estudiante.objects.create(
            codigo=codigo,
            nombre_completo=nombre_completo,
            carrera=carrera,
            telefono=telefono,
            email=email
        )
        return CrearEstudiante(estudiante=estudiante, success=True)


class RegistrarPrestamo(graphene.Mutation):
    class Arguments:
        id_carpeta = graphene.ID(required=True)
        id_usuario = graphene.ID(required=True)
        id_autoridad = graphene.ID(required=True)
        id_solicitante = graphene.ID(required=True)
        fecha_limite_devolucion = graphene.Date(required=True)
        observaciones = graphene.String()

    prestamo = graphene.Field(PrestamoType)
    success = graphene.Boolean()
    error = graphene.String()

    def mutate(root, info, id_carpeta, id_usuario, id_autoridad, id_solicitante, fecha_limite_devolucion, observaciones=""):
        # Validar carpeta disponible
        try:
            carpeta = Carpeta.objects.get(id=id_carpeta)
        except Carpeta.DoesNotExist:
            return RegistrarPrestamo(success=False, error="Carpeta no encontrada")

        if carpeta.estado != 'disponible':
            return RegistrarPrestamo(success=False, error="La carpeta no está disponible para préstamo")

        # Validar bloqueo del solicitante
        bloqueos_activos = Bloqueo.objects.filter(solicitante_id=id_solicitante, activo=True)
        if bloqueos_activos.exists():
            return RegistrarPrestamo(success=False, error="El solicitante está bloqueado y no puede recibir préstamos")

        # Registrar préstamo
        prestamo = Prestamo.objects.create(
            carpeta_id=id_carpeta,
            usuario_id=id_usuario,
            autoridad_id=id_autoridad,
            solicitante_id=id_solicitante,
            fecha_prestamo=datetime.date.today(),
            fecha_limite_devolucion=fecha_limite_devolucion,
            observaciones=observaciones,
            estado='activo'
        )

        # Actualizar estado carpeta a prestada
        carpeta.estado = 'prestada'
        carpeta.save()

        return RegistrarPrestamo(prestamo=prestamo, success=True)


class RegistrarDevolucion(graphene.Mutation):
    class Arguments:
        id_prestamo = graphene.ID(required=True)
    
    prestamo = graphene.Field(PrestamoType)
    success = graphene.Boolean()
    error = graphene.String()

    def mutate(root, info, id_prestamo):
        try:
            prestamo = Prestamo.objects.get(id=id_prestamo)
        except Prestamo.DoesNotExist:
            return RegistrarDevolucion(success=False, error="Préstamo no encontrado")

        if prestamo.estado == 'devuelto':
            return RegistrarDevolucion(success=False, error="Este préstamo ya fue devuelto anteriormente")

        # Marcar devuelto
        prestamo.estado = 'devuelto'
        prestamo.fecha_devolucion_real = datetime.date.today()
        prestamo.save()

        # Liberar carpeta
        carpeta = prestamo.carpeta
        carpeta.estado = 'disponible'
        carpeta.save()

        return RegistrarDevolucion(prestamo=prestamo, success=True)


class CrearAmbiente(graphene.Mutation):
    class Arguments:
        nombre = graphene.String(required=True)
        descripcion = graphene.String()

    ambiente = graphene.Field(AmbienteType)
    success = graphene.Boolean()

    def mutate(root, info, nombre, descripcion=""):
        ambiente = Ambiente.objects.create(nombre=nombre, descripcion=descripcion)
        return CrearAmbiente(ambiente=ambiente, success=True)


class CrearEstante(graphene.Mutation):
    class Arguments:
        codigo = graphene.String(required=True)
        id_ambiente = graphene.ID(required=True)

    estante = graphene.Field(EstanteType)
    success = graphene.Boolean()

    def mutate(root, info, codigo, id_ambiente):
        estante = Estante.objects.create(codigo=codigo, ambiente_id=id_ambiente)
        return CrearEstante(estante=estante, success=True)


class CrearPiso(graphene.Mutation):
    class Arguments:
        numero = graphene.Int(required=True)
        id_estante = graphene.ID(required=True)

    piso = graphene.Field(PisoType)
    success = graphene.Boolean()

    def mutate(root, info, numero, id_estante):
        piso = Piso.objects.create(numero=numero, estante_id=id_estante)
        return CrearPiso(piso=piso, success=True)


class CrearCarpeta(graphene.Mutation):
    class Arguments:
        codigo_carpeta = graphene.String(required=True)
        id_estudiante = graphene.ID(required=True)
        id_piso = graphene.ID(required=True)
        observaciones = graphene.String()

    carpeta = graphene.Field(CarpetaType)
    success = graphene.Boolean()

    def mutate(root, info, codigo_carpeta, id_estudiante, id_piso, observaciones=""):
        carpeta = Carpeta.objects.create(
            codigo_carpeta=codigo_carpeta,
            estudiante_id=id_estudiante,
            piso_id=id_piso,
            observaciones=observaciones,
            estado='disponible'
        )
        return CrearCarpeta(carpeta=carpeta, success=True)


class RegistrarAutoridad(graphene.Mutation):
    class Arguments:
        nombre_completo = graphene.String(required=True)
        cargo = graphene.String(required=True)
        area = graphene.String()
        telefono = graphene.String()
        email = graphene.String()

    autoridad = graphene.Field(AutoridadType)
    success = graphene.Boolean()

    def mutate(root, info, nombre_completo, cargo, area="", telefono="", email=""):
        autoridad = Autoridad.objects.create(
            nombre_completo=nombre_completo,
            cargo=cargo,
            area=area,
            telefono=telefono,
            email=email
        )
        return RegistrarAutoridad(autoridad=autoridad, success=True)


class RegistrarUsuario(graphene.Mutation):
    class Arguments:
        username = graphene.String(required=True)
        password = graphene.String(required=True)
        first_name = graphene.String(required=True)
        last_name = graphene.String(required=True)
        email = graphene.String(required=True)
        nombre_rol = graphene.String(required=True) # "administrador" o "administrativo"

    usuario = graphene.Field(UserType)
    success = graphene.Boolean()
    error = graphene.String()

    def mutate(root, info, username, password, first_name, last_name, email, nombre_rol):
        # NOTA: En un futuro aquí se puede verificar: if not info.context.user.is_superuser...
        
        if User.objects.filter(username=username).exists():
            return RegistrarUsuario(success=False, error="El nombre de usuario ya existe")
            
        # Crear usuario de Django
        usuario = User.objects.create_user(
            username=username,
            password=password,
            first_name=first_name,
            last_name=last_name,
            email=email
        )
        
        # Validar o crear el Rol especificado
        rol, created = Rol.objects.get_or_create(nombre_rol=nombre_rol.lower())
        if created:
            if nombre_rol.lower() == 'administrador':
                rol.descripcion = 'Nivel más alto de acceso. Puede realizar bloqueos, desbloqueos y configuraciones.'
                # Se le puede dar permisos de superusuario a nivel de Django si se requiere:
                # usuario.is_superuser = True
                # usuario.is_staff = True
                # usuario.save()
            else:
                rol.descripcion = 'Nivel administrativo. Solo registros de préstamos y ubicaciones.'
            rol.save()
            
        # Asignar el rol al usuario
        UsuarioRol.objects.create(usuario=usuario, rol=rol)
        
        return RegistrarUsuario(usuario=usuario, success=True)


class Mutation(graphene.ObjectType):
    crear_estudiante = CrearEstudiante.Field()
    registrar_prestamo = RegistrarPrestamo.Field()
    registrar_devolucion = RegistrarDevolucion.Field()
    
    crear_ambiente = CrearAmbiente.Field()
    crear_estante = CrearEstante.Field()
    crear_piso = CrearPiso.Field()
    crear_carpeta = CrearCarpeta.Field()
    registrar_autoridad = RegistrarAutoridad.Field()
    registrar_usuario = RegistrarUsuario.Field()

schema = graphene.Schema(query=Query, mutation=Mutation)
