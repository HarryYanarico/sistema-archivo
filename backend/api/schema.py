import graphene
from graphene_django import DjangoObjectType
from django.contrib.auth.models import User, Group, Permission
from django.contrib.contenttypes.models import ContentType
import graphql_jwt
from .models import (
    Persona, Ambiente, Estante, Piso, Carpeta, Documento,
    Incidente, DetalleIncidente, Bloqueo, Prestamo, Prorroga
)


# ============================
# TYPES
# ============================

class PermissionType(graphene.ObjectType):
    id = graphene.ID()
    codename = graphene.String()
    name = graphene.String()
    content_type = graphene.String()

class PermissionDetailType(graphene.ObjectType):
    id = graphene.ID()
    codename = graphene.String()
    name = graphene.String()
    content_type_model = graphene.String()

class GroupType(DjangoObjectType):
    class Meta:
        model = Group
        fields = ("id", "name")
    permissions = graphene.List(PermissionDetailType)

    def resolve_permissions(self, info):
        return self.permissions.all()

class UserType(DjangoObjectType):
    class Meta:
        model = User
        fields = ("id", "username", "first_name", "last_name", "email", "is_active", "date_joined", "groups", "user_permissions")

    permissions_list = graphene.List(graphene.String)

    def resolve_permissions_list(self, info):
        return list(self.get_all_permissions())


class PermissionInputType(graphene.InputObjectType):
    id = graphene.ID(required=True)


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
# HELPERS
# ============================

def has_admin_permission(user):
    return user.is_authenticated and (
        user.groups.filter(name="Administrador").exists() or user.is_superuser
    )


# ============================
# QUERIES
# ============================

class Query(graphene.ObjectType):
    me = graphene.Field(UserType)
    all_users = graphene.List(UserType)
    all_groups = graphene.List(GroupType)
    all_permissions = graphene.List(PermissionDetailType)
    all_personas = graphene.List(PersonaType)
    all_carpetas = graphene.List(CarpetaType)
    all_prestamos = graphene.List(PrestamoType)
    all_incidentes = graphene.List(IncidenteType)
    persona_por_ci = graphene.Field(PersonaType, ci=graphene.String(required=True))

    def resolve_me(root, info):
        user = info.context.user
        if user.is_authenticated:
            return user
        return None

    def resolve_all_users(root, info):
        if not has_admin_permission(info.context.user):
            return []
        return User.objects.all().order_by('-date_joined')

    def resolve_all_groups(root, info):
        return Group.objects.all()

    def resolve_all_permissions(root, info):
        perms = Permission.objects.select_related('content_type').filter(
            content_type__app_label='api'
        ).order_by('content_type__model', 'codename')
        result = []
        for p in perms:
            result.append(PermissionDetailType(
                id=p.id,
                codename=p.codename,
                name=p.name,
                content_type_model=p.content_type.model,
            ))
        return result

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
# MUTATIONS
# ============================

class CreateUser(graphene.Mutation):
    class Arguments:
        username = graphene.String(required=True)
        password = graphene.String(required=True)
        first_name = graphene.String(required=True)
        last_name = graphene.String(required=True)
        email = graphene.String()
        group_id = graphene.ID()
        permission_ids = graphene.List(graphene.ID)

    user = graphene.Field(UserType)
    success = graphene.Boolean()
    error = graphene.String()

    def mutate(root, info, username, password, first_name, last_name, email=None, group_id=None, permission_ids=None):
        if not has_admin_permission(info.context.user):
            return CreateUser(success=False, error="Acceso denegado. Se requiere rol de Administrador.")

        if User.objects.filter(username=username).exists():
            return CreateUser(success=False, error="El nombre de usuario ya está en uso.")

        user = User.objects.create_user(
            username=username,
            password=password,
            first_name=first_name,
            last_name=last_name,
            email=email or "",
        )

        if group_id:
            try:
                group = Group.objects.get(id=group_id)
                user.groups.add(group)
            except Group.DoesNotExist:
                pass

        if permission_ids:
            perms = Permission.objects.filter(id__in=permission_ids)
            user.user_permissions.set(perms)

        return CreateUser(user=user, success=True)


class UpdateUser(graphene.Mutation):
    class Arguments:
        user_id = graphene.ID(required=True)
        first_name = graphene.String()
        last_name = graphene.String()
        email = graphene.String()
        is_active = graphene.Boolean()
        group_id = graphene.ID()
        permission_ids = graphene.List(graphene.ID)

    user = graphene.Field(UserType)
    success = graphene.Boolean()
    error = graphene.String()

    def mutate(root, info, user_id, first_name=None, last_name=None, email=None, is_active=None, group_id=None, permission_ids=None):
        if not has_admin_permission(info.context.user):
            return UpdateUser(success=False, error="Acceso denegado.")

        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return UpdateUser(success=False, error="Usuario no encontrado.")

        if user.is_superuser:
            return UpdateUser(success=False, error="No se puede modificar el superusuario.")

        if first_name is not None:
            user.first_name = first_name
        if last_name is not None:
            user.last_name = last_name
        if email is not None:
            user.email = email
        if is_active is not None:
            user.is_active = is_active

        if group_id is not None:
            user.groups.clear()
            if group_id:
                try:
                    group = Group.objects.get(id=group_id)
                    user.groups.add(group)
                except Group.DoesNotExist:
                    pass

        if permission_ids is not None:
            perms = Permission.objects.filter(id__in=permission_ids)
            user.user_permissions.set(perms)

        user.save()
        return UpdateUser(user=user, success=True)


class DeleteUser(graphene.Mutation):
    class Arguments:
        user_id = graphene.ID(required=True)

    success = graphene.Boolean()
    error = graphene.String()

    def mutate(root, info, user_id):
        if not has_admin_permission(info.context.user):
            return DeleteUser(success=False, error="Acceso denegado.")

        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return DeleteUser(success=False, error="Usuario no encontrado.")

        if user.is_superuser:
            return DeleteUser(success=False, error="No se puede eliminar el superusuario.")

        current_user = info.context.user
        if str(current_user.id) == str(user_id):
            return DeleteUser(success=False, error="No puedes eliminar tu propio usuario.")

        user.delete()
        return DeleteUser(success=True)


class CreateGroup(graphene.Mutation):
    class Arguments:
        name = graphene.String(required=True)
        permission_ids = graphene.List(graphene.ID)

    group = graphene.Field(GroupType)
    success = graphene.Boolean()
    error = graphene.String()

    def mutate(root, info, name, permission_ids=None):
        if not has_admin_permission(info.context.user):
            return CreateGroup(success=False, error="Acceso denegado.")

        if Group.objects.filter(name=name).exists():
            return CreateGroup(success=False, error="Ya existe un grupo con ese nombre.")

        group = Group.objects.create(name=name)

        if permission_ids:
            perms = Permission.objects.filter(id__in=permission_ids)
            group.permissions.set(perms)

        return CreateGroup(group=group, success=True)


class RegistrarUsuarioPersona(graphene.Mutation):
    class Arguments:
        ci = graphene.String(required=True)
        nombre = graphene.String(required=True)
        apellido = graphene.String(required=True)
        email = graphene.String()
        username = graphene.String()
        password = graphene.String()
        nombre_rol = graphene.String()

    persona = graphene.Field(PersonaType)
    success = graphene.Boolean()
    error = graphene.String()

    def mutate(root, info, ci, nombre, apellido, email=None, username=None, password=None, nombre_rol=None):
        user = info.context.user
        if not has_admin_permission(user):
            return RegistrarUsuarioPersona(success=False, error="Acceso denegado.")

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
            ci=ci, nombre=nombre, apellido=apellido, email=email, usuario=usuario
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
        if not user.is_authenticated:
            return CrearCarpeta(success=False, error="Acceso denegado.")
        if not (user.is_superuser or user.groups.filter(name__in=["Administrador", "Administrativo"]).exists() or user.has_perm('api.add_carpeta')):
            return CrearCarpeta(success=False, error="No tienes permisos para crear carpetas.")

        carpeta = Carpeta.objects.create(descripcion=descripcion, piso_id=id_piso, estado=True)
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
        if not user.is_authenticated:
            return RegistrarPrestamo(success=False, error="Acceso denegado.")
        if not (user.is_superuser or user.groups.filter(name__in=["Administrador", "Administrativo"]).exists() or user.has_perm('api.add_prestamo')):
            return RegistrarPrestamo(success=False, error="No tienes permisos para registrar préstamos.")

        try:
            carpeta = Carpeta.objects.get(id=id_carpeta)
        except Carpeta.DoesNotExist:
            return RegistrarPrestamo(success=False, error="Carpeta no encontrada")

        if not carpeta.estado:
            return RegistrarPrestamo(success=False, error="La carpeta no está disponible")

        prestamo = Prestamo.objects.create(
            carpeta_id=id_carpeta, persona_id=id_persona,
            fecha_limite=fecha_limite, observaciones=observaciones, estado='activo'
        )
        carpeta.estado = False
        carpeta.save()

        return RegistrarPrestamo(prestamo=prestamo, success=True)


class Mutation(graphene.ObjectType):
    token_auth = graphql_jwt.ObtainJSONWebToken.Field()
    verify_token = graphql_jwt.Verify.Field()
    refresh_token = graphql_jwt.Refresh.Field()

    create_user = CreateUser.Field()
    update_user = UpdateUser.Field()
    delete_user = DeleteUser.Field()
    create_group = CreateGroup.Field()

    registrar_usuario_persona = RegistrarUsuarioPersona.Field()
    crear_carpeta = CrearCarpeta.Field()
    registrar_prestamo = RegistrarPrestamo.Field()

schema = graphene.Schema(query=Query, mutation=Mutation)
