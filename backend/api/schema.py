from datetime import date, timedelta

import graphene
from .models import Perfil, TempToken
from api.services.otp_service import generate_2fa_qr, obtener_tiempo_ntp
import pyotp   #para la autenticacion 2f
from graphene_django import DjangoObjectType
from django.contrib.auth.models import User, Group, Permission
from django.contrib.contenttypes.models import ContentType
import graphql_jwt
from django.db import transaction
from django.db.models import Count, Q
from django.utils import timezone
from .models import (
    Persona, Ambiente, Estante, Piso, Carpeta, Documento,
    Incidente, DetalleIncidente, Bloqueo, Prestamo, PrestamoCarpeta, Prorroga, Devolucion,
    AsignacionAmbiente, Traspaso, TraspasoCarpeta,
)


FEATURE_PERMS = {
    'gestionar_carpetas', 'gestionar_documentos',
    'gestionar_prestamos', 'gestionar_devoluciones', 'gestionar_traspasos',
    'gestionar_ubicaciones', 'gestionar_personas', 'gestionar_bloqueos',
    'gestionar_prorrogas', 'gestionar_usuarios',
    'ver_dashboard',
}


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
        fields = ("id", "username", "first_name", "last_name", "email", "is_active", "is_superuser", "date_joined", "groups", "user_permissions")

    permissions_list = graphene.List(graphene.String)
    direct_permissions_list = graphene.List(graphene.String)
    direct_permission_ids = graphene.List(graphene.ID)
    ambientes_asignados = graphene.List(graphene.ID)
    session_invalidated_at = graphene.DateTime()

    def resolve_permissions_list(self, info):
        return [p for p in self.get_all_permissions()
                if p.split('.')[-1] in FEATURE_PERMS]

    def resolve_direct_permissions_list(self, info):
        return [f'{p.content_type.app_label}.{p.codename}'
                for p in self.user_permissions.filter(codename__in=FEATURE_PERMS)]

    def resolve_direct_permission_ids(self, info):
        return [str(p.id) for p in self.user_permissions.filter(codename__in=FEATURE_PERMS)]

    def resolve_ambientes_asignados(self, info):
        viewer = info.context.user
        if viewer == self or has_admin_permission(viewer):
            return list(AsignacionAmbiente.objects.filter(usuario=self).values_list('ambiente_id', flat=True))
        return []

    def resolve_session_invalidated_at(self, info):
        try:
            return self.perfil.session_invalidated_at
        except Exception:
            return None


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

class DocumentoType(DjangoObjectType):
    class Meta:
        model = Documento
        fields = "__all__"

class CarpetaType(DjangoObjectType):
    class Meta:
        model = Carpeta
        fields = "__all__"

    documentos = graphene.List(DocumentoType)

    def resolve_documentos(self, info):
        return self.documento_set.all()

class IncidenteType(DjangoObjectType):
    class Meta:
        model = Incidente
        fields = "__all__"

    detalles = graphene.List(lambda: DetalleIncidenteType)

    def resolve_detalles(self, info):
        return self.detalleincidente_set.all()

class DetalleIncidenteType(DjangoObjectType):
    class Meta:
        model = DetalleIncidente
        fields = "__all__"

class BloqueoType(DjangoObjectType):
    class Meta:
        model = Bloqueo
        fields = "__all__"

class PrestamoCarpetaType(DjangoObjectType):
    class Meta:
        model = PrestamoCarpeta
        fields = "__all__"

class PrestamoType(DjangoObjectType):
    class Meta:
        model = Prestamo
        fields = "__all__"

    prestamo_carpetas = graphene.List(PrestamoCarpetaType)
    carpetas = graphene.List(CarpetaType)

    def resolve_prestamo_carpetas(self, info):
        return PrestamoCarpeta.objects.filter(prestamo=self)

    def resolve_carpetas(self, info):
        return self.carpetas.all().order_by('-id')[:2]

class DevolucionType(DjangoObjectType):
    class Meta:
        model = Devolucion
        fields = "__all__"

class ProrrogaType(DjangoObjectType):
    class Meta:
        model = Prorroga
        fields = "__all__"


class AsignacionAmbienteType(DjangoObjectType):
    class Meta:
        model = AsignacionAmbiente
        fields = "__all__"


class TraspasoCarpetaType(DjangoObjectType):
    class Meta:
        model = TraspasoCarpeta
        fields = "__all__"


class TraspasoType(DjangoObjectType):
    class Meta:
        model = Traspaso
        fields = "__all__"


# ============================
# PAGINATION TYPES
# ============================

class CarpetaPagination(graphene.ObjectType):
    items = graphene.List(CarpetaType)
    total_count = graphene.Int()

class PersonaPagination(graphene.ObjectType):
    items = graphene.List(PersonaType)
    total_count = graphene.Int()

class PrestamoPagination(graphene.ObjectType):
    items = graphene.List(PrestamoType)
    total_count = graphene.Int()

class TraspasoPagination(graphene.ObjectType):
    items = graphene.List(TraspasoType)
    total_count = graphene.Int()

class UserPagination(graphene.ObjectType):
    items = graphene.List(UserType)
    total_count = graphene.Int()

class DevolucionPagination(graphene.ObjectType):
    items = graphene.List(DevolucionType)
    total_count = graphene.Int()

class IncidentePagination(graphene.ObjectType):
    items = graphene.List(IncidenteType)
    total_count = graphene.Int()

class PrestamoCarpetaPagination(graphene.ObjectType):
    items = graphene.List(PrestamoCarpetaType)
    total_count = graphene.Int()

class ProrrogaPagination(graphene.ObjectType):
    items = graphene.List(ProrrogaType)
    total_count = graphene.Int()


# ============================
# DASHBOARD TYPES
# ============================

class AmbienteCarpetaCount(graphene.ObjectType):
    ambiente_id = graphene.ID()
    ambiente_nombre = graphene.String()
    count = graphene.Int()

class PrestamoVencidoType(DjangoObjectType):
    class Meta:
        model = Prestamo
        fields = ("id", "fecha_prest", "fecha_limite", "observaciones", "persona", "usuario", "autorizado_por")

class DashboardStats(graphene.ObjectType):
    total_carpetas = graphene.Int()
    prestamos_activos = graphene.Int()
    prestamos_vencidos = graphene.Int()
    prestamos_vencidos_count = graphene.Int()
    carpetas_disponibles = graphene.Int()
    personas_count = graphene.Int()
    traspasos_pendientes = graphene.Int()
    incidentes_activos = graphene.Int()
    carpetas_por_ambiente = graphene.List(AmbienteCarpetaCount)
    prestamos_recientes = graphene.List(PrestamoType)
    prestamos_por_vencer = graphene.List(PrestamoType)
    devoluciones_recientes = graphene.List(DevolucionType)
    capacidad_por_ambiente = graphene.List(AmbienteCarpetaCount)


class NotificationItem(graphene.ObjectType):
    id = graphene.String()
    tipo = graphene.String()
    mensaje = graphene.String()
    link = graphene.String()
    fecha = graphene.String()


# ============================
# HELPERS
# ============================

def has_admin_permission(user):
    return user.is_authenticated and (
        user.groups.filter(name="Administrador").exists() or user.is_superuser
    )


def _build_notifications(user):
    today = date.today()
    items = []

    is_admin = has_admin_permission(user)
    if not is_admin:
        amb_ids = list(AsignacionAmbiente.objects.filter(
            usuario=user
        ).values_list('ambiente_id', flat=True))

    vencidos = Prestamo.objects.filter(
        fecha_limite__lt=today,
        prestamocarpeta__estado='prestado'
    ).distinct()
    if not is_admin:
        vencidos = vencidos.filter(
            prestamocarpeta__carpeta__piso__estante__ambiente_id__in=amb_ids
        )
    for p in vencidos:
        days = (today - p.fecha_limite).days
        items.append(NotificationItem(
            id=f"vencido_{p.id}",
            tipo="VENCIMIENTO",
            mensaje=f"Préstamo a {p.persona.nombre} {p.persona.apellido} vencido hace {days} día{'s' if days != 1 else ''}",
            link="/prestamos",
            fecha=p.fecha_limite.isoformat(),
        ))

    por_vencer = Prestamo.objects.filter(
        fecha_limite__gte=today,
        fecha_limite__lte=today + timedelta(days=3),
        prestamocarpeta__estado='prestado'
    ).distinct()
    if not is_admin:
        por_vencer = por_vencer.filter(
            prestamocarpeta__carpeta__piso__estante__ambiente_id__in=amb_ids
        )
    for p in por_vencer:
        items.append(NotificationItem(
            id=f"por_vencer_{p.id}",
            tipo="PROXIMO_VENCER",
            mensaje=f"Préstamo a {p.persona.nombre} {p.persona.apellido} vence el {p.fecha_limite}",
            link="/prestamos",
            fecha=str(p.fecha_limite),
        ))

    traspasos_qs = Traspaso.objects.filter(ubicado=False)
    if not is_admin:
        traspasos_qs = traspasos_qs.filter(
            Q(ambiente_origen_id__in=amb_ids) | Q(ambiente_destino_id__in=amb_ids)
        )
    for t in traspasos_qs:
        items.append(NotificationItem(
            id=f"traspaso_{t.id}",
            tipo="TRASPASO",
            mensaje=f"Traspaso #{t.id} pendiente de ubicar ({t.ambiente_origen.nombre} → {t.ambiente_destino.nombre})",
            link="/traspasos",
            fecha=t.fecha.date().isoformat(),
        ))

    incidentes = Incidente.objects.filter(estado=True)
    if not is_admin:
        incidentes = incidentes.filter(
            carpetas__piso__estante__ambiente_id__in=amb_ids
        ).distinct()
    for inc in incidentes:
        count = DetalleIncidente.objects.filter(incidente=inc).count()
        items.append(NotificationItem(
            id=f"incidente_{inc.id}",
            tipo="INCIDENTE",
            mensaje=f"Incidente '{inc.tipo_inci}' activo - {count} carpeta{'s' if count != 1 else ''} afectada{'s' if count != 1 else ''}",
            link="/carpetas",
            fecha=inc.fecha_reporte.isoformat(),
        ))

    dev_recientes = Devolucion.objects.filter(
        fecha_devol__gte=today - timedelta(days=7),
        estado_devolucion__in=['danado', 'incompleto'],
    )
    if not is_admin:
        dev_recientes = dev_recientes.filter(
            prestamo_carpeta__carpeta__piso__estante__ambiente_id__in=amb_ids
        )
    for d in dev_recientes:
        pc = d.prestamo_carpeta
        desc = pc.carpeta.descripcion if pc and pc.carpeta else "N/A"
        label = "dañado" if d.estado_devolucion == 'danado' else "incompleto"
        items.append(NotificationItem(
            id=f"devolucion_{d.id}",
            tipo="DEVOLUCION_ESTADO",
            mensaje=f"Devolución de '{desc}' registrada como {label}",
            link="/prestamos",
            fecha=str(d.fecha_devol),
        ))

    if is_admin or user.has_perm('api.gestionar_bloqueos'):
        bloqueos = Bloqueo.objects.filter(fecha_desbloq__isnull=True)
        for b in bloqueos:
            nombre = f"{b.persona.nombre} {b.persona.apellido}" if b.persona else "N/A"
            items.append(NotificationItem(
                id=f"bloqueo_{b.id}",
                tipo="BLOQUEO",
                mensaje=f"{nombre} bloqueada - {b.motivo_bloq}",
                link="/bloqueos",
                fecha=str(b.fecha_bloq),
            ))

    items.sort(key=lambda n: n.fecha, reverse=True)
    return items[:20]


# ============================
# QUERIES
# ============================

class Query(graphene.ObjectType):
    me = graphene.Field(UserType)
    all_users = graphene.List(UserType)
    all_users_paginated = graphene.Field(UserPagination,
        page=graphene.Int(default_value=1),
        page_size=graphene.Int(default_value=10),
        search=graphene.String(),
    )
    all_groups = graphene.List(GroupType)
    all_permissions = graphene.List(PermissionDetailType)
    all_personas = graphene.List(PersonaType)
    all_personas_paginated = graphene.Field(PersonaPagination,
        page=graphene.Int(default_value=1),
        page_size=graphene.Int(default_value=10),
        search=graphene.String(),
    )
    all_ambientes = graphene.List(AmbienteType)
    all_estantes = graphene.List(EstanteType)
    all_pisos = graphene.List(PisoType)
    all_carpetas = graphene.List(CarpetaType)
    all_carpetas_paginated = graphene.Field(CarpetaPagination,
        page=graphene.Int(default_value=1),
        page_size=graphene.Int(default_value=10),
        ambiente_id=graphene.String(),
        search=graphene.String(),
    )
    all_prestamos = graphene.List(PrestamoType)
    all_prestamos_paginated = graphene.Field(PrestamoPagination,
        page=graphene.Int(default_value=1),
        page_size=graphene.Int(default_value=10),
    )
    all_devoluciones = graphene.List(DevolucionType)
    all_devoluciones_paginated = graphene.Field(DevolucionPagination,
        page=graphene.Int(default_value=1),
        page_size=graphene.Int(default_value=10),
    )
    all_incidentes = graphene.List(IncidenteType)
    all_incidentes_paginated = graphene.Field(IncidentePagination,
        page=graphene.Int(default_value=1),
        page_size=graphene.Int(default_value=10),
    )
    all_bloqueos = graphene.List(BloqueoType)
    persona_por_ci = graphene.Field(PersonaType, ci=graphene.String(required=True))
    all_prestamoscarpeta_activas_paginated = graphene.Field(PrestamoCarpetaPagination,
        page=graphene.Int(default_value=1),
        page_size=graphene.Int(default_value=10),
    )
    prestamo_carpetas_paginated = graphene.Field(PrestamoCarpetaPagination,
        prestamo_id=graphene.ID(required=True),
        page=graphene.Int(default_value=1),
        page_size=graphene.Int(default_value=5),
    )
    all_prestamos_vencidos_paginated = graphene.Field(PrestamoPagination,
        page=graphene.Int(default_value=1),
        page_size=graphene.Int(default_value=10),
    )
    all_prestamos_activos_paginated = graphene.Field(PrestamoPagination,
        page=graphene.Int(default_value=1),
        page_size=graphene.Int(default_value=5),
    )
    all_prorrogas_paginated = graphene.Field(ProrrogaPagination,
        page=graphene.Int(default_value=1),
        page_size=graphene.Int(default_value=10),
    )
    all_traspasos = graphene.List(TraspasoType)
    all_traspasos_paginated = graphene.Field(TraspasoPagination,
        page=graphene.Int(default_value=1),
        page_size=graphene.Int(default_value=10),
    )
    mis_ambientes = graphene.List(AmbienteType)
    dashboard_stats = graphene.Field(DashboardStats)
    notifications = graphene.List(NotificationItem)
    notifications_unread_count = graphene.Int()

    def resolve_me(root, info):
        user = info.context.user
        if user.is_authenticated:
            return user
        return None

    def resolve_all_users(root, info):
        if not has_admin_permission(info.context.user):
            return []
        return User.objects.all().order_by('-date_joined')

    def resolve_all_users_paginated(root, info, page=1, page_size=10, search=None):
        if not has_admin_permission(info.context.user):
            return UserPagination(items=[], total_count=0)
        qs = User.objects.all().order_by('-date_joined')
        if search:
            q = search.lower()
            qs = qs.filter(
                Q(username__icontains=q) |
                Q(first_name__icontains=q) |
                Q(last_name__icontains=q) |
                Q(email__icontains=q)
            )
        total = qs.count()
        offset = (page - 1) * page_size
        return UserPagination(items=qs[offset:offset + page_size], total_count=total)

    def resolve_all_groups(root, info):
        if not has_admin_permission(info.context.user):
            return []
        return Group.objects.all()

    def resolve_all_permissions(root, info):
        if not has_admin_permission(info.context.user):
            return []
        perms = Permission.objects.filter(
            content_type__app_label='api',
            codename__in=FEATURE_PERMS,
        ).order_by('codename')
        result = []
        for p in perms:
            result.append(PermissionDetailType(
                id=p.id,
                codename=p.codename,
                name=p.name,
                content_type_model='feature',
            ))
        return result

    def resolve_all_personas(root, info):
        if not info.context.user.is_authenticated:
            return []
        return Persona.objects.all()

    def resolve_all_personas_paginated(root, info, page=1, page_size=10, search=None):
        if not info.context.user.is_authenticated:
            return PersonaPagination(items=[], total_count=0)
        qs = Persona.objects.all()
        if search:
            q = search.lower()
            qs = qs.filter(
                Q(ci__icontains=q) |
                Q(nombre__icontains=q) |
                Q(apellido__icontains=q)
            )
        total = qs.count()
        offset = (page - 1) * page_size
        return PersonaPagination(items=qs[offset:offset + page_size], total_count=total)

    def resolve_all_ambientes(root, info):
        user = info.context.user
        if not user.is_authenticated:
            return []
        if has_admin_permission(user):
            return Ambiente.objects.all()
        ids = AsignacionAmbiente.objects.filter(usuario=user).values_list('ambiente_id', flat=True)
        return Ambiente.objects.filter(id__in=ids)

    def resolve_mis_ambientes(root, info):
        user = info.context.user
        if not user.is_authenticated:
            return []
        if has_admin_permission(user):
            return Ambiente.objects.all()
        ids = AsignacionAmbiente.objects.filter(usuario=user).values_list('ambiente_id', flat=True)
        return Ambiente.objects.filter(id__in=ids)

    def resolve_all_estantes(root, info):
        user = info.context.user
        if not user.is_authenticated:
            return []
        if has_admin_permission(user):
            return Estante.objects.all()
        ids = AsignacionAmbiente.objects.filter(usuario=user).values_list('ambiente_id', flat=True)
        return Estante.objects.filter(ambiente_id__in=ids)

    def resolve_all_pisos(root, info):
        user = info.context.user
        if not user.is_authenticated:
            return []
        if has_admin_permission(user):
            return Piso.objects.all()
        ids = AsignacionAmbiente.objects.filter(usuario=user).values_list('ambiente_id', flat=True)
        return Piso.objects.filter(estante__ambiente_id__in=ids)

    def resolve_all_carpetas(root, info):
        user = info.context.user
        if not user.is_authenticated:
            return []
        if has_admin_permission(user):
            return Carpeta.objects.all()
        ids = AsignacionAmbiente.objects.filter(usuario=user).values_list('ambiente_id', flat=True)
        return Carpeta.objects.filter(piso__estante__ambiente_id__in=ids)

    def resolve_all_carpetas_paginated(root, info, page=1, page_size=10, ambiente_id=None, search=None):
        user = info.context.user
        if not user.is_authenticated:
            return CarpetaPagination(items=[], total_count=0)
        if has_admin_permission(user):
            qs = Carpeta.objects.all()
        else:
            ids = AsignacionAmbiente.objects.filter(usuario=user).values_list('ambiente_id', flat=True)
            qs = Carpeta.objects.filter(piso__estante__ambiente_id__in=ids)
        if ambiente_id:
            qs = qs.filter(piso__estante__ambiente_id=ambiente_id)
        if search:
            qs = qs.filter(descripcion__icontains=search)
        total = qs.count()
        offset = (page - 1) * page_size
        return CarpetaPagination(items=qs[offset:offset + page_size], total_count=total)

    def resolve_all_prestamos(root, info):
        user = info.context.user
        if not user.is_authenticated:
            return []
        if user.is_superuser or user.has_perm('api.gestionar_prestamos'):
            return Prestamo.objects.all()
        ids = AsignacionAmbiente.objects.filter(usuario=user).values_list('ambiente_id', flat=True)
        return Prestamo.objects.filter(prestamocarpeta__carpeta__piso__estante__ambiente_id__in=ids).distinct()

    def resolve_all_prestamos_paginated(root, info, page=1, page_size=10):
        user = info.context.user
        if not user.is_authenticated:
            return PrestamoPagination(items=[], total_count=0)
        if user.is_superuser or user.has_perm('api.gestionar_prestamos'):
            qs = Prestamo.objects.all()
        else:
            ids = AsignacionAmbiente.objects.filter(usuario=user).values_list('ambiente_id', flat=True)
            qs = Prestamo.objects.filter(prestamocarpeta__carpeta__piso__estante__ambiente_id__in=ids).distinct()
        total = qs.count()
        offset = (page - 1) * page_size
        return PrestamoPagination(items=qs[offset:offset + page_size], total_count=total)

    def resolve_all_devoluciones(root, info):
        user = info.context.user
        if not user.is_authenticated:
            return []
        if user.is_superuser or user.has_perm('api.gestionar_devoluciones'):
            return Devolucion.objects.all()
        ids = AsignacionAmbiente.objects.filter(usuario=user).values_list('ambiente_id', flat=True)
        return Devolucion.objects.filter(prestamo_carpeta__carpeta__piso__estante__ambiente_id__in=ids).distinct()

    def resolve_all_devoluciones_paginated(root, info, page=1, page_size=10):
        user = info.context.user
        if not user.is_authenticated:
            return DevolucionPagination(items=[], total_count=0)
        if user.is_superuser or user.has_perm('api.gestionar_devoluciones'):
            qs = Devolucion.objects.all()
        else:
            ids = AsignacionAmbiente.objects.filter(usuario=user).values_list('ambiente_id', flat=True)
            qs = Devolucion.objects.filter(prestamo_carpeta__carpeta__piso__estante__ambiente_id__in=ids).distinct()
        total = qs.count()
        offset = (page - 1) * page_size
        return DevolucionPagination(items=qs[offset:offset + page_size], total_count=total)

    def resolve_all_incidentes(root, info):
        user = info.context.user
        if not user.is_authenticated:
            return []
        if user.is_superuser or user.has_perm('api.gestionar_carpetas'):
            return Incidente.objects.all()
        ids = AsignacionAmbiente.objects.filter(usuario=user).values_list('ambiente_id', flat=True)
        return Incidente.objects.filter(carpeta__piso__estante__ambiente_id__in=ids).distinct()

    def resolve_all_incidentes_paginated(root, info, page=1, page_size=10):
        user = info.context.user
        if not user.is_authenticated:
            return IncidentePagination(items=[], total_count=0)
        if user.is_superuser or user.has_perm('api.gestionar_carpetas'):
            qs = Incidente.objects.all()
        else:
            ids = AsignacionAmbiente.objects.filter(usuario=user).values_list('ambiente_id', flat=True)
            qs = Incidente.objects.filter(carpeta__piso__estante__ambiente_id__in=ids).distinct()
        total = qs.count()
        offset = (page - 1) * page_size
        return IncidentePagination(items=qs[offset:offset + page_size], total_count=total)

    def resolve_all_prestamoscarpeta_activas_paginated(root, info, page=1, page_size=10):
        user = info.context.user
        if not user.is_authenticated:
            return PrestamoCarpetaPagination(items=[], total_count=0)
        qs = PrestamoCarpeta.objects.filter(estado='prestado').select_related(
            'prestamo__persona', 'carpeta'
        ).order_by('-prestamo__fecha_limite')
        if not (has_admin_permission(user) or user.has_perm('api.gestionar_prorrogas')):
            ids = AsignacionAmbiente.objects.filter(usuario=user).values_list('ambiente_id', flat=True)
            qs = qs.filter(carpeta__piso__estante__ambiente_id__in=ids)
        total = qs.count()
        offset = (page - 1) * page_size
        return PrestamoCarpetaPagination(items=qs[offset:offset + page_size], total_count=total)

    def resolve_prestamo_carpetas_paginated(root, info, prestamo_id, page=1, page_size=5):
        user = info.context.user
        if not user.is_authenticated:
            return PrestamoCarpetaPagination(items=[], total_count=0)
        qs = PrestamoCarpeta.objects.filter(prestamo_id=prestamo_id).select_related(
            'carpeta__piso__estante__ambiente'
        ).order_by('-id')
        total = qs.count()
        offset = (page - 1) * page_size
        return PrestamoCarpetaPagination(items=qs[offset:offset + page_size], total_count=total)

    def resolve_all_prestamos_vencidos_paginated(root, info, page=1, page_size=10):
        user = info.context.user
        if not user.is_authenticated:
            return PrestamoPagination(items=[], total_count=0)
        hoy = date.today()
        qs = Prestamo.objects.filter(fecha_limite__lt=hoy).select_related(
            'persona', 'usuario', 'autorizado_por'
        ).order_by('fecha_limite')
        if not (user.is_superuser or user.has_perm('api.gestionar_prestamos')):
            ids = AsignacionAmbiente.objects.filter(usuario=user).values_list('ambiente_id', flat=True)
            qs = qs.filter(prestamocarpeta__carpeta__piso__estante__ambiente_id__in=ids).distinct()
        total = qs.count()
        offset = (page - 1) * page_size
        return PrestamoPagination(items=qs[offset:offset + page_size], total_count=total)

    def resolve_all_prestamos_activos_paginated(root, info, page=1, page_size=5):
        user = info.context.user
        if not user.is_authenticated:
            return PrestamoPagination(items=[], total_count=0)
        ids_con_activas = PrestamoCarpeta.objects.filter(
            estado='prestado'
        ).values_list('prestamo_id', flat=True).distinct()
        qs = Prestamo.objects.filter(id__in=ids_con_activas).select_related(
            'persona', 'usuario', 'autorizado_por'
        ).order_by('-fecha_limite')
        if not (user.is_superuser or user.has_perm('api.gestionar_prestamos')):
            amb_ids = AsignacionAmbiente.objects.filter(usuario=user).values_list('ambiente_id', flat=True)
            qs = qs.filter(prestamocarpeta__carpeta__piso__estante__ambiente_id__in=amb_ids).distinct()
        total = qs.count()
        offset = (page - 1) * page_size
        return PrestamoPagination(items=qs[offset:offset + page_size], total_count=total)

    def resolve_all_prorrogas_paginated(root, info, page=1, page_size=10):
        user = info.context.user
        if not user.is_authenticated:
            return ProrrogaPagination(items=[], total_count=0)
        if has_admin_permission(user) or user.has_perm('api.gestionar_prorrogas'):
            qs = Prorroga.objects.all().order_by('-fecha_registro')
        else:
            ids = AsignacionAmbiente.objects.filter(usuario=user).values_list('ambiente_id', flat=True)
            qs = Prorroga.objects.filter(
                prestamo__prestamocarpeta__carpeta__piso__estante__ambiente_id__in=ids
            ).distinct().order_by('-fecha_registro')
        total = qs.count()
        offset = (page - 1) * page_size
        return ProrrogaPagination(items=qs[offset:offset + page_size], total_count=total)

    def resolve_all_bloqueos(root, info):
        if not has_admin_permission(info.context.user):
            return []
        return Bloqueo.objects.all().order_by('-fecha_bloq')

    def resolve_persona_por_ci(root, info, ci):
        if not has_admin_permission(info.context.user):
            return None
        try:
            return Persona.objects.get(ci=ci)
        except Persona.DoesNotExist:
            return None

    def resolve_all_traspasos(root, info):
        user = info.context.user
        if not user.is_authenticated:
            return []
        if has_admin_permission(user):
            return Traspaso.objects.all().order_by('-fecha')
        return Traspaso.objects.filter(usuario=user).order_by('-fecha')

    def resolve_all_traspasos_paginated(root, info, page=1, page_size=10):
        user = info.context.user
        if not user.is_authenticated:
            return TraspasoPagination(items=[], total_count=0)
        if has_admin_permission(user):
            qs = Traspaso.objects.all().order_by('-fecha')
        else:
            qs = Traspaso.objects.filter(usuario=user).order_by('-fecha')
        total = qs.count()
        offset = (page - 1) * page_size
        return TraspasoPagination(items=qs[offset:offset + page_size], total_count=total)

    def resolve_dashboard_stats(root, info):
        user = info.context.user
        if not user.is_authenticated:
            return DashboardStats()
        if not (user.is_superuser or user.has_perm('api.ver_dashboard')):
            return DashboardStats()

        today = date.today()

        total_carpetas = Carpeta.objects.count()
        prestamos_activos = PrestamoCarpeta.objects.filter(estado='prestado').count()
        prestamos_vencidos_qs = Prestamo.objects.filter(
            fecha_limite__lt=today,
            prestamocarpeta__estado='prestado'
        ).distinct()
        prestamos_vencidos_count = prestamos_vencidos_qs.count()
        carpetas_disponibles = Carpeta.objects.filter(estado='disponible').count()
        personas_count = Persona.objects.count()
        traspasos_pendientes = Traspaso.objects.filter(ubicado=False).count()
        incidentes_activos = Incidente.objects.filter(estado=True).count()

        carpetas_por_ambiente = (
            Carpeta.objects
            .values('piso__estante__ambiente__id', 'piso__estante__ambiente__nombre')
            .annotate(count=Count('id'))
            .order_by('-count')
        )
        carpetas_por_ambiente_list = [
            AmbienteCarpetaCount(
                ambiente_id=str(item['piso__estante__ambiente__id']),
                ambiente_nombre=item['piso__estante__ambiente__nombre'],
                count=item['count']
            )
            for item in carpetas_por_ambiente
        ]

        prestamos_recientes = Prestamo.objects.all().order_by('-fecha_prest')[:10]

        prestamos_por_vencer = Prestamo.objects.filter(
            fecha_limite__gte=today,
            prestamocarpeta__estado='prestado'
        ).distinct().order_by('fecha_limite')[:10]

        devoluciones_recientes = Devolucion.objects.all().order_by('-fecha_devol')[:10]

        return DashboardStats(
            total_carpetas=total_carpetas,
            prestamos_activos=prestamos_activos,
            prestamos_vencidos_count=prestamos_vencidos_count,
            carpetas_disponibles=carpetas_disponibles,
            personas_count=personas_count,
            traspasos_pendientes=traspasos_pendientes,
            incidentes_activos=incidentes_activos,
            carpetas_por_ambiente=carpetas_por_ambiente_list,
            prestamos_recientes=prestamos_recientes,
            prestamos_por_vencer=prestamos_por_vencer,
            devoluciones_recientes=devoluciones_recientes,
        )

    def resolve_notifications(root, info):
        user = info.context.user
        if not user.is_authenticated:
            return []
        return _build_notifications(user)

    def resolve_notifications_unread_count(root, info):
        user = info.context.user
        if not user.is_authenticated:
            return 0
        return len(_build_notifications(user))


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

        if permission_ids is not None:
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
            if hasattr(user, '_perm_cache'):
                delattr(user, '_perm_cache')
            if hasattr(user, '_group_perm_cache'):
                delattr(user, '_group_perm_cache')

        user.save()

        if str(user.id) != str(info.context.user.id) and (group_id is not None or permission_ids is not None):
            perfil, _ = Perfil.objects.get_or_create(user=user)
            perfil.session_invalidated_at = timezone.now()
            perfil.save()

        return UpdateUser(user=user, success=True)


class ActualizarPerfil(graphene.Mutation):
    class Arguments:
        first_name = graphene.String()
        last_name = graphene.String()
        current_password = graphene.String()
        new_password = graphene.String()

    user = graphene.Field(UserType)
    success = graphene.Boolean()
    error = graphene.String()

    def mutate(root, info, first_name=None, last_name=None, current_password=None, new_password=None):
        user = info.context.user
        if not user.is_authenticated:
            return ActualizarPerfil(success=False, error="No autenticado.")

        if first_name is not None:
            user.first_name = first_name
        if last_name is not None:
            user.last_name = last_name

        if new_password:
            if not current_password:
                return ActualizarPerfil(success=False, error="Debes proporcionar tu contraseña actual.")
            if not user.check_password(current_password):
                return ActualizarPerfil(success=False, error="Contraseña actual incorrecta.")
            user.set_password(new_password)

        user.save()
        return ActualizarPerfil(user=user, success=True)


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
            ci=ci, nombre=nombre, apellido=apellido, email=email
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
        if not (user.is_superuser or user.has_perm('api.gestionar_carpetas')):
            return CrearCarpeta(success=False, error="No tienes permisos para crear carpetas.")

        carpeta = Carpeta.objects.create(descripcion=descripcion, piso_id=id_piso, estado='disponible')
        return CrearCarpeta(carpeta=carpeta, success=True)


class EditarCarpeta(graphene.Mutation):
    class Arguments:
        id = graphene.ID(required=True)
        descripcion = graphene.String()
        estado = graphene.String()
        id_piso = graphene.ID()

    carpeta = graphene.Field(CarpetaType)
    success = graphene.Boolean()
    error = graphene.String()

    def mutate(root, info, id, descripcion=None, estado=None, id_piso=None):
        user = info.context.user
        if not user.is_authenticated:
            return EditarCarpeta(success=False, error="Acceso denegado.")
        if not (user.is_superuser or user.has_perm('api.gestionar_carpetas')):
            return EditarCarpeta(success=False, error="No tienes permisos para editar carpetas.")

        try:
            carpeta = Carpeta.objects.get(id=id)
        except Carpeta.DoesNotExist:
            return EditarCarpeta(success=False, error="Carpeta no encontrada.")

        if descripcion is not None:
            carpeta.descripcion = descripcion
        if estado is not None:
            carpeta.estado = estado
        if id_piso is not None:
            try:
                carpeta.piso = Piso.objects.get(id=id_piso)
            except Piso.DoesNotExist:
                return EditarCarpeta(success=False, error="Piso no encontrado.")
        carpeta.save()
        return EditarCarpeta(carpeta=carpeta, success=True)


class CrearDocumento(graphene.Mutation):
    class Arguments:
        codigo_doc = graphene.String(required=True)
        titulo = graphene.String(required=True)
        tipo_doc = graphene.String(required=True)
        id_carpeta = graphene.ID(required=True)
        propietario = graphene.String()

    documento = graphene.Field(DocumentoType)
    success = graphene.Boolean()
    error = graphene.String()

    def mutate(root, info, codigo_doc, titulo, tipo_doc, id_carpeta, propietario=None):
        user = info.context.user
        if not user.is_authenticated:
            return CrearDocumento(success=False, error="Acceso denegado.")
        if not (user.is_superuser or user.has_perm('api.gestionar_documentos')):
            return CrearDocumento(success=False, error="No tienes permisos para crear documentos.")

        try:
            carpeta = Carpeta.objects.get(id=id_carpeta)
        except Carpeta.DoesNotExist:
            return CrearDocumento(success=False, error="Carpeta no encontrada.")

        if Documento.objects.filter(codigo_doc=codigo_doc).exists():
            return CrearDocumento(success=False, error="Ya existe un documento con ese código.")

        documento = Documento.objects.create(
            codigo_doc=codigo_doc, titulo=titulo, tipo_doc=tipo_doc,
            carpeta=carpeta, propietario=propietario
        )
        return CrearDocumento(documento=documento, success=True)


class EditarDocumento(graphene.Mutation):
    class Arguments:
        id = graphene.ID(required=True)
        codigo_doc = graphene.String()
        titulo = graphene.String()
        tipo_doc = graphene.String()
        propietario = graphene.String()

    documento = graphene.Field(DocumentoType)
    success = graphene.Boolean()
    error = graphene.String()

    def mutate(root, info, id, codigo_doc=None, titulo=None, tipo_doc=None, propietario=None):
        user = info.context.user
        if not user.is_authenticated:
            return EditarDocumento(success=False, error="Acceso denegado.")
        if not (user.is_superuser or user.has_perm('api.gestionar_documentos')):
            return EditarDocumento(success=False, error="No tienes permisos para editar documentos.")

        try:
            documento = Documento.objects.get(id=id)
        except Documento.DoesNotExist:
            return EditarDocumento(success=False, error="Documento no encontrado.")

        if codigo_doc is not None:
            if Documento.objects.filter(codigo_doc=codigo_doc).exclude(id=id).exists():
                return EditarDocumento(success=False, error="Ya existe otro documento con ese código.")
            documento.codigo_doc = codigo_doc
        if titulo is not None:
            documento.titulo = titulo
        if tipo_doc is not None:
            documento.tipo_doc = tipo_doc
        if propietario is not None:
            documento.propietario = propietario

        documento.save()
        return EditarDocumento(documento=documento, success=True)


class RegistrarPrestamo(graphene.Mutation):
    class Arguments:
        ids_carpetas = graphene.List(graphene.ID, required=True)
        id_persona = graphene.ID(required=True)
        fecha_limite = graphene.Date(required=True)
        id_autorizado_por = graphene.ID(required=True)
        observaciones = graphene.String()

    prestamo = graphene.Field(PrestamoType)
    success = graphene.Boolean()
    error = graphene.String()

    def mutate(root, info, ids_carpetas, id_persona, fecha_limite, id_autorizado_por, observaciones=""):
        user = info.context.user
        if not user.is_authenticated:
            return RegistrarPrestamo(success=False, error="Acceso denegado.")
        if not (user.is_superuser or user.has_perm('api.gestionar_prestamos')):
            return RegistrarPrestamo(success=False, error="No tienes permisos para registrar préstamos.")

        carpetas = Carpeta.objects.filter(id__in=ids_carpetas)
        if carpetas.count() != len(ids_carpetas):
            return RegistrarPrestamo(success=False, error="Una o más carpetas no fueron encontradas")

        for carpeta in carpetas:
            if carpeta.estado != 'disponible':
                return RegistrarPrestamo(success=False, error=f"La carpeta {carpeta.id} no está disponible")

        try:
            autorizado_por = Persona.objects.get(id=id_autorizado_por)
        except Persona.DoesNotExist:
            return RegistrarPrestamo(success=False, error="Persona autorizante no encontrada.")

        prestamo = Prestamo.objects.create(
            persona_id=id_persona,
            usuario=user,
            autorizado_por=autorizado_por,
            fecha_limite=fecha_limite, observaciones=observaciones
        )

        for carpeta in carpetas:
            PrestamoCarpeta.objects.create(prestamo=prestamo, carpeta=carpeta, estado='prestado')
            carpeta.estado = 'prestado'
            carpeta.save()

        return RegistrarPrestamo(prestamo=prestamo, success=True)


class RegistrarDevolucion(graphene.Mutation):
    class Arguments:
        id_prestamo_carpeta = graphene.ID(required=True)
        observaciones = graphene.String()
        estado_devolucion = graphene.String(default_value='buen_estado')
        bloquear_persona = graphene.Boolean(default_value=False)

    devolucion = graphene.Field(DevolucionType)
    success = graphene.Boolean()
    error = graphene.String()

    def mutate(root, info, id_prestamo_carpeta, observaciones="", estado_devolucion='buen_estado', bloquear_persona=False):
        user = info.context.user
        if not user.is_authenticated:
            return RegistrarDevolucion(success=False, error="Acceso denegado.")
        if not (user.is_superuser or user.has_perm('api.gestionar_devoluciones')):
            return RegistrarDevolucion(success=False, error="No tienes permisos para registrar devoluciones.")

        try:
            pc = PrestamoCarpeta.objects.get(id=id_prestamo_carpeta)
        except PrestamoCarpeta.DoesNotExist:
            return RegistrarDevolucion(success=False, error="Registro de préstamo-carpeta no encontrado.")

        if Devolucion.objects.filter(prestamo_carpeta=pc).exists():
            return RegistrarDevolucion(success=False, error="Esta carpeta ya fue devuelta.")

        devolucion = Devolucion.objects.create(
            prestamo_carpeta=pc,
            usuario=user,
            observaciones=observaciones,
            estado_devolucion=estado_devolucion,
        )

        if bloquear_persona:
            prestamo = pc.prestamo
            persona = prestamo.persona
            if not Bloqueo.objects.filter(persona=persona, fecha_desbloq__isnull=True).exists():
                Bloqueo.objects.create(
                    usuario=user,
                    persona=persona,
                    motivo_bloq=f"Devolvió la carpeta \"{pc.carpeta.descripcion}\" en mal estado ({estado_devolucion}).",
                )

        pc.estado = 'devuelto'
        pc.save()

        carpeta = pc.carpeta
        carpeta.estado = 'disponible'
        carpeta.save()

        return RegistrarDevolucion(devolucion=devolucion, success=True)


class CrearIncidente(graphene.Mutation):
    class Arguments:
        tipo_inci = graphene.String(required=True)
        carpeta_ids = graphene.List(graphene.ID, required=True)
        descripcion = graphene.String()

    incidente = graphene.Field(IncidenteType)
    success = graphene.Boolean()
    error = graphene.String()

    def mutate(root, info, tipo_inci, carpeta_ids, descripcion=""):
        user = info.context.user
        if not user.is_authenticated:
            return CrearIncidente(success=False, error="Acceso denegado.")
        if not (user.is_superuser or user.has_perm('api.gestionar_carpetas')):
            return CrearIncidente(success=False, error="No tienes permisos para gestionar incidentes.")

        incidente = Incidente.objects.create(
            tipo_inci=tipo_inci,
            usuario=user,
        )

        for cid in carpeta_ids:
            try:
                carpeta = Carpeta.objects.get(id=cid)
                DetalleIncidente.objects.create(
                    incidente=incidente,
                    carpeta=carpeta,
                    descripcion=descripcion,
                )
            except Carpeta.DoesNotExist:
                pass

        return CrearIncidente(incidente=incidente, success=True)


class ResolverIncidente(graphene.Mutation):
    class Arguments:
        incidente_id = graphene.ID(required=True)

    success = graphene.Boolean()
    error = graphene.String()

    def mutate(root, info, incidente_id):
        user = info.context.user
        if not user.is_authenticated:
            return ResolverIncidente(success=False, error="Acceso denegado.")
        if not (user.is_superuser or user.has_perm('api.gestionar_carpetas')):
            return ResolverIncidente(success=False, error="No tienes permisos para gestionar incidentes.")

        try:
            incidente = Incidente.objects.get(id=incidente_id)
        except Incidente.DoesNotExist:
            return ResolverIncidente(success=False, error="Incidente no encontrado.")

        incidente.estado = False
        incidente.save()

        return ResolverIncidente(success=True)


class RegistrarProrroga(graphene.Mutation):
    class Arguments:
        prestamo_id = graphene.ID(required=True)
        persona_solicita_id = graphene.ID(required=True)
        dias_otorgados = graphene.Int(required=True)
        motivo = graphene.String()

    prorroga = graphene.Field(ProrrogaType)
    success = graphene.Boolean()
    error = graphene.String()

    def mutate(root, info, prestamo_id, persona_solicita_id, dias_otorgados, motivo=""):
        user = info.context.user
        if not user.is_authenticated:
            return RegistrarProrroga(success=False, error="Acceso denegado.")
        if not (user.is_superuser or user.has_perm('api.gestionar_prorrogas')):
            return RegistrarProrroga(success=False, error="No tienes permisos para registrar prórrogas.")

        try:
            prestamo = Prestamo.objects.get(id=prestamo_id)
        except Prestamo.DoesNotExist:
            return RegistrarProrroga(success=False, error="Préstamo no encontrado.")

        if not prestamo.prestamocarpeta_set.filter(estado='prestado').exists():
            return RegistrarProrroga(success=False, error="El préstamo no tiene carpetas activas.")

        if dias_otorgados < 1:
            return RegistrarProrroga(success=False, error="Los días deben ser mayor a 0.")

        try:
            persona = Persona.objects.get(id=persona_solicita_id)
        except Persona.DoesNotExist:
            return RegistrarProrroga(success=False, error="Persona no encontrada.")

        prorroga = Prorroga.objects.create(
            prestamo=prestamo,
            persona_solicita=persona,
            usuario=user,
            dias_otorgados=dias_otorgados,
            motivo=motivo or None,
        )

        prestamo.fecha_limite = prestamo.fecha_limite + timedelta(days=dias_otorgados)
        prestamo.save()

        return RegistrarProrroga(prorroga=prorroga, success=True)


class CrearPersona(graphene.Mutation):
    class Arguments:
        ci = graphene.String(required=True)
        nombre = graphene.String(required=True)
        apellido = graphene.String(required=True)
        telefono = graphene.String()
        email = graphene.String()
        direccion = graphene.String()
        fecha_naci = graphene.Date()
        cargo = graphene.String()

    persona = graphene.Field(PersonaType)
    success = graphene.Boolean()
    error = graphene.String()

    def mutate(root, info, ci, nombre, apellido, telefono=None, email=None, direccion=None, fecha_naci=None, cargo=None):
        user = info.context.user
        if not has_admin_permission(user):
            return CrearPersona(success=False, error="Acceso denegado. Se requiere rol de Administrador.")

        if Persona.objects.filter(ci=ci).exists():
            return CrearPersona(success=False, error="Ya existe una persona con ese CI.")

        persona = Persona.objects.create(
            ci=ci, nombre=nombre, apellido=apellido,
            telefono=telefono, email=email, direccion=direccion,
            fecha_naci=fecha_naci, cargo=cargo
        )
        return CrearPersona(persona=persona, success=True)


class ActualizarPersona(graphene.Mutation):
    class Arguments:
        id = graphene.ID(required=True)
        ci = graphene.String()
        nombre = graphene.String()
        apellido = graphene.String()
        telefono = graphene.String()
        email = graphene.String()
        direccion = graphene.String()
        fecha_naci = graphene.Date()
        cargo = graphene.String()

    persona = graphene.Field(PersonaType)
    success = graphene.Boolean()
    error = graphene.String()

    def mutate(root, info, id, ci=None, nombre=None, apellido=None, telefono=None, email=None, direccion=None, fecha_naci=None, cargo=None):
        user = info.context.user
        if not has_admin_permission(user):
            return ActualizarPersona(success=False, error="Acceso denegado. Se requiere rol de Administrador.")

        try:
            persona = Persona.objects.get(id=id)
        except Persona.DoesNotExist:
            return ActualizarPersona(success=False, error="Persona no encontrada.")

        if ci is not None:
            if Persona.objects.filter(ci=ci).exclude(id=id).exists():
                return ActualizarPersona(success=False, error="Ya existe otra persona con ese CI.")
            persona.ci = ci
        if nombre is not None:
            persona.nombre = nombre
        if apellido is not None:
            persona.apellido = apellido
        if telefono is not None:
            persona.telefono = telefono
        if email is not None:
            persona.email = email
        if direccion is not None:
            persona.direccion = direccion
        if fecha_naci is not None:
            persona.fecha_naci = fecha_naci
        if cargo is not None:
            persona.cargo = cargo

        persona.save()
        return ActualizarPersona(persona=persona, success=True)


class CrearAmbiente(graphene.Mutation):
    class Arguments:
        nombre = graphene.String(required=True)
        ubicacion = graphene.String()
        descripcion = graphene.String()

    ambiente = graphene.Field(AmbienteType)
    success = graphene.Boolean()
    error = graphene.String()

    def mutate(root, info, nombre, ubicacion=None, descripcion=None):
        user = info.context.user
        if not user.is_authenticated:
            return CrearAmbiente(success=False, error="Acceso denegado.")
        if not (user.is_superuser or user.has_perm('api.gestionar_ubicaciones')):
            return CrearAmbiente(success=False, error="No tienes permisos para gestionar ubicaciones.")

        ambiente = Ambiente.objects.create(nombre=nombre, ubicacion=ubicacion, descripcion=descripcion)
        return CrearAmbiente(ambiente=ambiente, success=True)


class EditarAmbiente(graphene.Mutation):
    class Arguments:
        id = graphene.ID(required=True)
        nombre = graphene.String()
        ubicacion = graphene.String()
        descripcion = graphene.String()

    ambiente = graphene.Field(AmbienteType)
    success = graphene.Boolean()
    error = graphene.String()

    def mutate(root, info, id, nombre=None, ubicacion=None, descripcion=None):
        user = info.context.user
        if not user.is_authenticated:
            return EditarAmbiente(success=False, error="Acceso denegado.")
        if not (user.is_superuser or user.has_perm('api.gestionar_ubicaciones')):
            return EditarAmbiente(success=False, error="No tienes permisos para gestionar ubicaciones.")

        try:
            ambiente = Ambiente.objects.get(id=id)
        except Ambiente.DoesNotExist:
            return EditarAmbiente(success=False, error="Ambiente no encontrado.")

        if nombre is not None:
            ambiente.nombre = nombre
        if ubicacion is not None:
            ambiente.ubicacion = ubicacion
        if descripcion is not None:
            ambiente.descripcion = descripcion
        ambiente.save()
        return EditarAmbiente(ambiente=ambiente, success=True)


class CrearEstante(graphene.Mutation):
    class Arguments:
        codigo = graphene.String(required=True)
        numero = graphene.Int()
        descripcion = graphene.String()
        estado = graphene.String()
        limite_pisos = graphene.Int()
        id_ambiente = graphene.ID(required=True)

    estante = graphene.Field(EstanteType)
    success = graphene.Boolean()
    error = graphene.String()

    def mutate(root, info, codigo, id_ambiente, numero=None, descripcion=None, estado=None, limite_pisos=None):
        user = info.context.user
        if not user.is_authenticated:
            return CrearEstante(success=False, error="Acceso denegado.")
        if not (user.is_superuser or user.has_perm('api.gestionar_ubicaciones')):
            return CrearEstante(success=False, error="No tienes permisos para gestionar ubicaciones.")

        try:
            ambiente = Ambiente.objects.get(id=id_ambiente)
        except Ambiente.DoesNotExist:
            return CrearEstante(success=False, error="Ambiente no encontrado.")

        estante = Estante.objects.create(codigo=codigo, numero=numero, descripcion=descripcion, estado=estado, limite_pisos=limite_pisos if limite_pisos is not None else 1, ambiente=ambiente)
        return CrearEstante(estante=estante, success=True)

class EditarEstante(graphene.Mutation):
    class Arguments:
        id = graphene.ID(required=True)
        codigo = graphene.String()
        numero = graphene.Int()
        descripcion = graphene.String()
        estado = graphene.String()
        limite_pisos = graphene.Int()
        id_ambiente = graphene.ID()

    estante = graphene.Field(EstanteType)
    success = graphene.Boolean()
    error = graphene.String()

    def mutate(root, info, id, codigo=None, numero=None, descripcion=None, estado=None, limite_pisos=None, id_ambiente=None):
        user = info.context.user
        if not user.is_authenticated:
            return EditarEstante(success=False, error="Acceso denegado.")
        if not (user.is_superuser or user.has_perm('api.gestionar_ubicaciones')):
            return EditarEstante(success=False, error="No tienes permisos para gestionar ubicaciones.")

        try:
            estante = Estante.objects.get(id=id)
        except Estante.DoesNotExist:
            return EditarEstante(success=False, error="Estante no encontrado.")

        if codigo is not None:
            estante.codigo = codigo
        if numero is not None:
            estante.numero = numero
        if descripcion is not None:
            estante.descripcion = descripcion
        if estado is not None:
            estante.estado = estado
        if limite_pisos is not None:
            estante.limite_pisos = limite_pisos
        if id_ambiente is not None:
            try:
                estante.ambiente = Ambiente.objects.get(id=id_ambiente)
            except Ambiente.DoesNotExist:
                return EditarEstante(success=False, error="Ambiente no encontrado.")
        estante.save()
        return EditarEstante(estante=estante, success=True)


class CrearPiso(graphene.Mutation):
    class Arguments:
        nro_fila = graphene.Int(required=True)
        descripcion = graphene.String()
        id_estante = graphene.ID(required=True)

    piso = graphene.Field(PisoType)
    success = graphene.Boolean()
    error = graphene.String()

    def mutate(root, info, nro_fila, id_estante, descripcion=None):
        user = info.context.user
        if not user.is_authenticated:
            return CrearPiso(success=False, error="Acceso denegado.")
        if not (user.is_superuser or user.has_perm('api.gestionar_ubicaciones')):
            return CrearPiso(success=False, error="No tienes permisos para gestionar ubicaciones.")

        try:
            estante = Estante.objects.get(id=id_estante)
        except Estante.DoesNotExist:
            return CrearPiso(success=False, error="Estante no encontrado.")

        if estante.limite_pisos and Piso.objects.filter(estante=estante).count() >= estante.limite_pisos:
            return CrearPiso(success=False, error=f"Límite de {estante.limite_pisos} pisos alcanzado para el estante {estante.codigo}.")

        piso = Piso.objects.create(nro_fila=nro_fila, descripcion=descripcion, estante=estante)
        return CrearPiso(piso=piso, success=True)


class EditarPiso(graphene.Mutation):
    class Arguments:
        id = graphene.ID(required=True)
        nro_fila = graphene.Int()
        descripcion = graphene.String()
        id_estante = graphene.ID()

    piso = graphene.Field(PisoType)
    success = graphene.Boolean()
    error = graphene.String()

    def mutate(root, info, id, nro_fila=None, descripcion=None, id_estante=None):
        user = info.context.user
        if not user.is_authenticated:
            return EditarPiso(success=False, error="Acceso denegado.")
        if not (user.is_superuser or user.has_perm('api.gestionar_ubicaciones')):
            return EditarPiso(success=False, error="No tienes permisos para gestionar ubicaciones.")

        try:
            piso = Piso.objects.get(id=id)
        except Piso.DoesNotExist:
            return EditarPiso(success=False, error="Piso no encontrado.")

        if nro_fila is not None:
            piso.nro_fila = nro_fila
        if descripcion is not None:
            piso.descripcion = descripcion
        if id_estante is not None:
            try:
                piso.estante = Estante.objects.get(id=id_estante)
            except Estante.DoesNotExist:
                return EditarPiso(success=False, error="Estante no encontrado.")
        piso.save()
        return EditarPiso(piso=piso, success=True)

class Login2FA(graphene.Mutation):

    class Arguments:
        username = graphene.String(required=True)
        password = graphene.String(required=True)

    success = graphene.Boolean()
    requires_2fa = graphene.Boolean()
    setup_required = graphene.Boolean()
    qr_code = graphene.String()
    user_id = graphene.Int()
    temp_token = graphene.String()
    error = graphene.String()

    def mutate(root, info, username, password):

        from django.contrib.auth import authenticate

        user = authenticate(username=username, password=password)

        if user is None:
            return Login2FA(
                success=False,
                error="Credenciales incorrectas"
            )

        perfil, created = Perfil.objects.get_or_create(user=user)

        # 🟡 CASO 1: NO TIENE 2FA CONFIGURADO
        if not perfil.is_2fa_enabled or not perfil.secreto_2fa:

            secret, qr = generate_2fa_qr(user.username)

            perfil.secreto_2fa = secret
            perfil.is_2fa_enabled = True
            perfil.save()

            temp = TempToken.create_token(user)

            return Login2FA(
                success=True,
                requires_2fa=True,
                setup_required=True,
                qr_code=qr,
                user_id=user.id,
                temp_token=temp.token
            )

        # 🟢 CASO 2: YA TIENE 2FA
        temp = TempToken.create_token(user)

        return Login2FA(
            success=True,
            requires_2fa=True,
            setup_required=False,
            user_id=user.id,
            temp_token=temp.token
        )
class Verify2FA(graphene.Mutation):

    class Arguments:
        user_id = graphene.Int(required=True)
        code = graphene.String(required=True)
        temp_token = graphene.String(required=True)

    success = graphene.Boolean()
    token = graphene.String()
    error = graphene.String()

    def mutate(root, info, user_id, code, temp_token):

        from .models import Perfil

        try:
            user = User.objects.get(id=user_id)
            perfil = Perfil.objects.get(user_id=user_id)

        except:
            return Verify2FA(
                success=False,
                error="Usuario no encontrado"
            )

        try:
            temp = TempToken.objects.get(token=temp_token, user=user)
        except TempToken.DoesNotExist:
            return Verify2FA(
                success=False,
                error="Token de verificación inválido o expirado. Vuelve a iniciar sesión."
            )

        if temp.is_expired():
            temp.delete()
            return Verify2FA(
                success=False,
                error="Token de verificación expirado. Vuelve a iniciar sesión."
            )

        ntp_time = obtener_tiempo_ntp()
        totp = pyotp.TOTP(perfil.secreto_2fa)

        if not totp.verify(code, valid_window=1, for_time=ntp_time):

            return Verify2FA(
                success=False,
                error="Código inválido"
            )

        temp.delete()
        TempToken.objects.filter(user=user, expires_at__lt=timezone.now()).delete()
        token = graphql_jwt.shortcuts.get_token(user)

        return Verify2FA(
            success=True,
            token=token
        )

class ResetUser2FA(graphene.Mutation):
    class Arguments:
        user_id = graphene.ID(required=True)

    success = graphene.Boolean()
    error = graphene.String()

    def mutate(root, info, user_id):
        if not has_admin_permission(info.context.user):
            return ResetUser2FA(success=False, error="Acceso denegado. Se requiere rol de Administrador.")
        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return ResetUser2FA(success=False, error="Usuario no encontrado.")
        perfil, _ = Perfil.objects.get_or_create(user=user)
        perfil.is_2fa_enabled = False
        perfil.secreto_2fa = None
        perfil.save()
        return ResetUser2FA(success=True)
    
class AsignarAmbientes(graphene.Mutation):
    class Arguments:
        usuario_id = graphene.ID(required=True)
        ids_ambientes = graphene.List(graphene.ID, required=True)

    success = graphene.Boolean()
    error = graphene.String()

    def mutate(root, info, usuario_id, ids_ambientes):
        if not has_admin_permission(info.context.user):
            return AsignarAmbientes(success=False, error="Acceso denegado. Se requiere rol de Administrador.")

        try:
            target = User.objects.get(id=usuario_id)
        except User.DoesNotExist:
            return AsignarAmbientes(success=False, error="Usuario no encontrado.")

        AsignacionAmbiente.objects.filter(usuario=target).delete()
        for amb_id in ids_ambientes:
            AsignacionAmbiente.objects.create(usuario=target, ambiente_id=amb_id)

        return AsignarAmbientes(success=True)


class RegistrarTraspaso(graphene.Mutation):
    class Arguments:
        ids_carpetas = graphene.List(graphene.ID, required=True)
        id_ambiente_origen = graphene.ID(required=True)
        id_ambiente_destino = graphene.ID(required=True)
        observaciones = graphene.String()

    traspaso = graphene.Field(TraspasoType)
    success = graphene.Boolean()
    error = graphene.String()

    def mutate(root, info, ids_carpetas, id_ambiente_origen, id_ambiente_destino, observaciones=""):
        user = info.context.user
        if not user.is_authenticated:
            return RegistrarTraspaso(success=False, error="Acceso denegado.")

        if not has_admin_permission(user):
            asignado = AsignacionAmbiente.objects.filter(usuario=user, ambiente_id=id_ambiente_origen).exists()
            if not asignado:
                return RegistrarTraspaso(success=False, error="No tienes asignado el ambiente origen.")

        try:
            origen = Ambiente.objects.get(id=id_ambiente_origen)
            destino = Ambiente.objects.get(id=id_ambiente_destino)
        except Ambiente.DoesNotExist:
            return RegistrarTraspaso(success=False, error="Ambiente no encontrado.")

        carpetas = Carpeta.objects.filter(id__in=ids_carpetas)
        if carpetas.count() != len(ids_carpetas):
            return RegistrarTraspaso(success=False, error="Una o más carpetas no fueron encontradas.")

        for carpeta in carpetas:
            if carpeta.estado != 'disponible':
                return RegistrarTraspaso(success=False, error=f"La carpeta '{carpeta.descripcion}' no está disponible.")

        traspaso = Traspaso.objects.create(
            usuario=user, ambiente_origen=origen, ambiente_destino=destino, observaciones=observaciones
        )
        for carpeta in carpetas:
            TraspasoCarpeta.objects.create(traspaso=traspaso, carpeta=carpeta)

        return RegistrarTraspaso(traspaso=traspaso, success=True)


class UbicarCarpetas(graphene.Mutation):
    class Arguments:
        ids_traspaso_carpeta = graphene.List(graphene.ID, required=True)
        id_piso = graphene.ID(required=True)

    success = graphene.Boolean()
    error = graphene.String()

    def mutate(root, info, ids_traspaso_carpeta, id_piso):
        user = info.context.user
        if not user.is_authenticated:
            return UbicarCarpetas(success=False, error="Acceso denegado.")
        if not (user.is_superuser or user.has_perm('api.gestionar_carpetas')):
            return UbicarCarpetas(success=False, error="No tienes permisos para ubicar carpetas.")

        try:
            piso = Piso.objects.get(id=id_piso)
        except Piso.DoesNotExist:
            return UbicarCarpetas(success=False, error="Piso no encontrado.")

        items = TraspasoCarpeta.objects.filter(id__in=ids_traspaso_carpeta)
        if items.count() != len(ids_traspaso_carpeta):
            return UbicarCarpetas(success=False, error="Uno o más ítems no fueron encontrados.")

        for item in items:
            if item.ubicado:
                return UbicarCarpetas(success=False, error="Una o más carpetas ya están ubicadas.")
            item.piso_asignado = piso
            item.ubicado = True
            item.save()

        traspasos_afectados = set(items.values_list('traspaso_id', flat=True))
        for t_id in traspasos_afectados:
            t = Traspaso.objects.get(id=t_id)
            if not t.items.filter(ubicado=False).exists():
                t.ubicado = True
                t.save()

        return UbicarCarpetas(success=True)


class CrearBloqueo(graphene.Mutation):
    class Arguments:
        persona_id = graphene.ID(required=True)
        motivo = graphene.String(required=True)

    bloqueo = graphene.Field(BloqueoType)
    success = graphene.Boolean()
    error = graphene.String()

    def mutate(root, info, persona_id, motivo):
        user = info.context.user
        if not has_admin_permission(user):
            return CrearBloqueo(success=False, error="Acceso denegado. Se requiere rol de Administrador.")

        try:
            persona = Persona.objects.get(id=persona_id)
        except Persona.DoesNotExist:
            return CrearBloqueo(success=False, error="Persona no encontrada.")

        if Bloqueo.objects.filter(persona=persona, fecha_desbloq__isnull=True).exists():
            return CrearBloqueo(success=False, error="Esta persona ya tiene un bloqueo activo.")

        bloqueo = Bloqueo.objects.create(
            motivo_bloq=motivo,
            usuario=user,
            persona=persona,
        )
        return CrearBloqueo(bloqueo=bloqueo, success=True)


class DesbloquearPersona(graphene.Mutation):
    class Arguments:
        bloqueo_id = graphene.ID(required=True)

    bloqueo = graphene.Field(BloqueoType)
    success = graphene.Boolean()
    error = graphene.String()

    def mutate(root, info, bloqueo_id):
        user = info.context.user
        if not has_admin_permission(user):
            return DesbloquearPersona(success=False, error="Acceso denegado. Se requiere rol de Administrador.")

        try:
            bloqueo = Bloqueo.objects.get(id=bloqueo_id)
        except Bloqueo.DoesNotExist:
            return DesbloquearPersona(success=False, error="Bloqueo no encontrado.")

        if bloqueo.fecha_desbloq:
            return DesbloquearPersona(success=False, error="Esta persona ya fue desbloqueada.")

        bloqueo.fecha_desbloq = date.today()
        bloqueo.save()

        return DesbloquearPersona(bloqueo=bloqueo, success=True)


class GenerateResetCode(graphene.Mutation):
    class Arguments:
        user_id = graphene.ID(required=True)

    success = graphene.Boolean()
    code = graphene.String()
    error = graphene.String()

    def mutate(root, info, user_id):
        if not has_admin_permission(info.context.user):
            return GenerateResetCode(success=False, error="Acceso denegado.")
        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return GenerateResetCode(success=False, error="Usuario no encontrado.")

        temp = TempToken.create_reset_token(user)
        return GenerateResetCode(success=True, code=temp.token)


class VerifyResetCode(graphene.Mutation):
    class Arguments:
        username = graphene.String(required=True)
        code = graphene.String(required=True)

    success = graphene.Boolean()
    error = graphene.String()

    def mutate(root, info, username, code):
        try:
            user = User.objects.get(username=username)
        except User.DoesNotExist:
            return VerifyResetCode(success=False, error="Usuario no encontrado.")

        try:
            temp = TempToken.objects.get(token=code, user=user, purpose='reset')
        except TempToken.DoesNotExist:
            return VerifyResetCode(success=False, error="Código inválido o expirado.")

        if temp.is_expired():
            temp.delete()
            return VerifyResetCode(success=False, error="El código ha expirado. Solicita uno nuevo.")

        return VerifyResetCode(success=True)


class SetNewPassword(graphene.Mutation):
    class Arguments:
        username = graphene.String(required=True)
        code = graphene.String(required=True)
        new_password = graphene.String(required=True)

    success = graphene.Boolean()
    error = graphene.String()

    def mutate(root, info, username, code, new_password):
        if len(new_password) < 8:
            return SetNewPassword(success=False, error="La contraseña debe tener al menos 8 caracteres.")

        try:
            user = User.objects.get(username=username)
        except User.DoesNotExist:
            return SetNewPassword(success=False, error="Usuario no encontrado.")

        try:
            temp = TempToken.objects.get(token=code, user=user, purpose='reset')
        except TempToken.DoesNotExist:
            return SetNewPassword(success=False, error="Código inválido o expirado.")

        if temp.is_expired():
            temp.delete()
            return SetNewPassword(success=False, error="El código ha expirado. Solicita uno nuevo.")

        user.set_password(new_password)
        user.save()
        temp.delete()
        TempToken.objects.filter(user=user, purpose='reset').delete()

        return SetNewPassword(success=True)


class ForzarCierreSesion(graphene.Mutation):
    class Arguments:
        user_id = graphene.ID(required=True)

    success = graphene.Boolean()
    error = graphene.String()

    def mutate(root, info, user_id):
        if not has_admin_permission(info.context.user):
            return ForzarCierreSesion(success=False, error="Acceso denegado.")
        
        current_user = info.context.user
        if str(current_user.id) == str(user_id):
            return ForzarCierreSesion(success=False, error="No puedes forzar el cierre de tu propia sesión.")

        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return ForzarCierreSesion(success=False, error="Usuario no encontrado.")

        if user.is_superuser:
            return ForzarCierreSesion(success=False, error="No se puede forzar el cierre de un superusuario.")

        try:
            perfil, created = Perfil.objects.get_or_create(user=user)
            perfil.session_invalidated_at = timezone.now()
            perfil.save()
        except Exception as e:
            return ForzarCierreSesion(success=False, error=f"Error al actualizar perfil: {str(e)}")

        try:
            from graphql_jwt.refresh_token.models import RefreshToken
            RefreshToken.objects.filter(user=user).delete()
        except Exception:
            pass

        return ForzarCierreSesion(success=True, error=None)


class Mutation(graphene.ObjectType):
    login_2fa = Login2FA.Field()
    verify_2fa = Verify2FA.Field()
    verify_token = graphql_jwt.Verify.Field()
    refresh_token = graphql_jwt.Refresh.Field()

    create_user = CreateUser.Field()
    update_user = UpdateUser.Field()
    delete_user = DeleteUser.Field()
    create_group = CreateGroup.Field()

    registrar_usuario_persona = RegistrarUsuarioPersona.Field()
    crear_ambiente = CrearAmbiente.Field()
    editar_ambiente = EditarAmbiente.Field()
    crear_estante = CrearEstante.Field()
    editar_estante = EditarEstante.Field()
    crear_piso = CrearPiso.Field()
    editar_piso = EditarPiso.Field()
    crear_carpeta = CrearCarpeta.Field()
    editar_carpeta = EditarCarpeta.Field()
    crear_documento = CrearDocumento.Field()
    editar_documento = EditarDocumento.Field()
    registrar_prestamo = RegistrarPrestamo.Field()
    registrar_devolucion = RegistrarDevolucion.Field()
    crear_incidente = CrearIncidente.Field()
    resolver_incidente = ResolverIncidente.Field()
    registrar_prorroga = RegistrarProrroga.Field()
    crear_persona = CrearPersona.Field()
    actualizar_persona = ActualizarPersona.Field()
    actualizar_perfil = ActualizarPerfil.Field()

    reset_user_2fa = ResetUser2FA.Field()
    asignar_ambientes = AsignarAmbientes.Field()
    registrar_traspaso = RegistrarTraspaso.Field()
    ubicar_carpetas = UbicarCarpetas.Field()
    crear_bloqueo = CrearBloqueo.Field()
    desbloquear_persona = DesbloquearPersona.Field()
    generate_reset_code = GenerateResetCode.Field()
    verify_reset_code = VerifyResetCode.Field()
    set_new_password = SetNewPassword.Field()
    forzar_cierre_sesion = ForzarCierreSesion.Field()

schema = graphene.Schema(query=Query, mutation=Mutation)
