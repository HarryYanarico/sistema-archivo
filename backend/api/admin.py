from django.contrib import admin
from .models import (
    Persona, Ambiente, Estante, Piso, Carpeta, Documento,
    Incidente, DetalleIncidente, Bloqueo, Prestamo, PrestamoCarpeta,
    Prorroga, Devolucion, Perfil, AsignacionAmbiente, Traspaso, TraspasoCarpeta,
)

admin.site.register(Persona)
admin.site.register(Ambiente)
admin.site.register(Estante)
admin.site.register(Piso)
admin.site.register(Carpeta)
admin.site.register(Documento)
admin.site.register(Incidente)
admin.site.register(DetalleIncidente)
admin.site.register(Bloqueo)
admin.site.register(Prestamo)
admin.site.register(PrestamoCarpeta)
admin.site.register(Prorroga)
admin.site.register(Devolucion)
admin.site.register(Perfil)
admin.site.register(AsignacionAmbiente)
admin.site.register(Traspaso)
admin.site.register(TraspasoCarpeta)
