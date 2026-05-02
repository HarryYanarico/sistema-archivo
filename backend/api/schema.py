import graphene
from graphene_django import DjangoObjectType
from django.contrib.auth.models import User, Group
import datetime
import graphql_jwt
from .models import (
    Persona, Ambiente, Estante, Piso, Carpeta, Documento,
    Incidente, DetalleIncidente, Bloqueo, Prestamo, Prorroga
)

class UserType(DjangoObjectType):
    class Meta:
        model = User
        fields = ("id", "username", "first_name", "last_name", "email", "is_active", "groups")

class GroupType(DjangoObjectType):
    class Meta:
        model = Group
        fields = ("id", "name")

class PersonaType(DjangoObjectType):
    class Meta:
        model = Persona
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

class IncidenteType(DjangoObjectType):
    class Meta:
        model = Incidente
        fields = "__all__"

class DetalleIncidenteType(DjangoObjectType):
    class Meta:
        model = DetalleIncidente
        fields = "__all__"

class BloqueoType(DjangoObjectType):
    class Meta:
        model = Bloqueo
        fields = "__all__"

class PrestamoType(DjangoObjectType):
    class Meta:
        model = Prestamo
        fields = "__all__"

class ProrrogaType(DjangoObjectType):
    class Meta:
        model = Prorroga
        fields = "__all__"


# ============================
# QUERIES (Consultas)
# ============================

class Query(graphene.ObjectType):
    # 4 consultas de ejemplo
    all_personas = graphene.List(PersonaType)
    all_carpetas = graphene.List(CarpetaType)
    all_prestamos = graphene.List(PrestamoType)
    all_incidentes = graphene.List(IncidenteType)

    # Buscador básico de persona por CI
    persona_por_ci = graphene.Field(PersonaType, ci=graphene.String(required=True))

    def resolve_all_personas(root, info):
        return Persona.objects.all()

    def resolve_all_carpetas(root, info):
        return Carpeta.objects.all()

    def resolve_all_prestamos(root, info):
        return Prestamo.objects.all()
        
    def resolve_all_incidentes(root, info):
        return Incidente.objects.all()

    def resolve_persona_por_ci(root, info, ci):
        try:
            return Persona.objects.get(ci=ci)
        except Persona.DoesNotExist:
            return None


# ============================
# MUTATIONS (Inserciones)
# ============================

class RegistrarUsuarioPersona(graphene.Mutation):
    """Crea una persona y al mismo tiempo un usuario en Django (opcional) con su Rol."""
    class Arguments:
        ci = graphene.String(required=True)
        nombre = graphene.String(required=True)
        apellido = graphene.String(required=True)
        email = graphene.String()
        username = graphene.String()
        password = graphene.String()
        nombre_rol = graphene.String() # Ej: "Administrador"

    persona = graphene.Field(PersonaType)
    success = graphene.Boolean()
    error = graphene.String()

    def mutate(root, info, ci, nombre, apellido, email=None, username=None, password=None, nombre_rol=None):
        user = info.context.user
        if not user.is_authenticated or not user.groups.filter(name="Administrador").exists():
            return RegistrarUsuarioPersona(success=False, error="Acceso denegado. Se requiere rol de Administrador.")

        if Persona.objects.filter(ci=ci).exists():
            return RegistrarUsuarioPersona(success=False, error="La persona con este CI ya existe.")
            
        usuario = None
        if username and password:
            if User.objects.filter(username=username).exists():
                return RegistrarUsuarioPersona(success=False, error="El username ya está en uso.")
            
            usuario = User.objects.create_user(
                username=username,
                password=password,
                first_name=nombre,
                last_name=apellido,
                email=email or ""
            )
            
            if nombre_rol:
                grupo, created = Group.objects.get_or_create(name=nombre_rol)
                usuario.groups.add(grupo)

        persona = Persona.objects.create(
            ci=ci,
            nombre=nombre,
            apellido=apellido,
            email=email,
            usuario=usuario
        )
        return RegistrarUsuarioPersona(persona=persona, success=True)


class CrearCarpeta(graphene.Mutation):
    class Arguments:
        descripcion = graphene.String(required=True)
        id_piso = graphene.ID(required=True)

    carpeta = graphene.Field(CarpetaType)
    success = graphene.Boolean()
    error = graphene.String()

    def mutate(root, info, descripcion, id_piso):
        user = info.context.user
        if not user.is_authenticated or not user.groups.filter(name__in=["Administrador", "Administrativo"]).exists():
            return CrearCarpeta(success=False, error="Acceso denegado. No tienes permisos para crear carpetas.")

        carpeta = Carpeta.objects.create(
            descripcion=descripcion,
            piso_id=id_piso,
            estado=True
        )
        return CrearCarpeta(carpeta=carpeta, success=True)


class RegistrarPrestamo(graphene.Mutation):
    class Arguments:
        id_carpeta = graphene.ID(required=True)
        id_persona = graphene.ID(required=True)
        fecha_limite = graphene.Date(required=True)
        observaciones = graphene.String()

    prestamo = graphene.Field(PrestamoType)
    success = graphene.Boolean()
    error = graphene.String()

    def mutate(root, info, id_carpeta, id_persona, fecha_limite, observaciones=""):
        user = info.context.user
        if not user.is_authenticated or not user.groups.filter(name__in=["Administrador", "Administrativo"]).exists():
            return RegistrarPrestamo(success=False, error="Acceso denegado. No tienes permisos para registrar préstamos.")

        try:
            carpeta = Carpeta.objects.get(id=id_carpeta)
        except Carpeta.DoesNotExist:
            return RegistrarPrestamo(success=False, error="Carpeta no encontrada")

        if not carpeta.estado:
            return RegistrarPrestamo(success=False, error="La carpeta no está disponible (estado=False)")

        # Registrar préstamo
        prestamo = Prestamo.objects.create(
            carpeta_id=id_carpeta,
            persona_id=id_persona,
            fecha_limite=fecha_limite,
            observaciones=observaciones,
            estado='activo'
        )

        # Actualizar estado carpeta a no disponible
        carpeta.estado = False
        carpeta.save()

        return RegistrarPrestamo(prestamo=prestamo, success=True)


class Mutation(graphene.ObjectType):
    token_auth = graphql_jwt.ObtainJSONWebToken.Field()
    verify_token = graphql_jwt.Verify.Field()
    refresh_token = graphql_jwt.Refresh.Field()

    registrar_usuario_persona = RegistrarUsuarioPersona.Field()
    crear_carpeta = CrearCarpeta.Field()
    registrar_prestamo = RegistrarPrestamo.Field()

schema = graphene.Schema(query=Query, mutation=Mutation)
