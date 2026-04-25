from django.db import models
from django.contrib.auth.models import User

class Rol(models.Model):
    nombre_rol = models.CharField(max_length=50, unique=True)
    descripcion = models.CharField(max_length=255, blank=True, null=True)

    def __str__(self):
        return self.nombre_rol

class UsuarioRol(models.Model):
    usuario = models.ForeignKey(User, on_delete=models.CASCADE)
    rol = models.ForeignKey(Rol, on_delete=models.CASCADE)
    fecha_asignacion = models.DateField(auto_now_add=True)

class Estudiante(models.Model):
    codigo = models.CharField(max_length=20, unique=True)
    nombre_completo = models.CharField(max_length=200)
    carrera = models.CharField(max_length=100, blank=True, null=True)
    telefono = models.CharField(max_length=20, blank=True, null=True)
    email = models.EmailField(max_length=100, blank=True, null=True)

    def __str__(self):
        return self.nombre_completo

class Autoridad(models.Model):
    nombre_completo = models.CharField(max_length=200)
    cargo = models.CharField(max_length=100)
    area = models.CharField(max_length=100, blank=True, null=True)
    telefono = models.CharField(max_length=20, blank=True, null=True)
    email = models.EmailField(max_length=100, blank=True, null=True)

    def __str__(self):
        return self.nombre_completo

class Ambiente(models.Model):
    nombre = models.CharField(max_length=100)
    descripcion = models.CharField(max_length=255, blank=True, null=True)

    def __str__(self):
        return self.nombre

class Estante(models.Model):
    codigo = models.CharField(max_length=50)
    ambiente = models.ForeignKey(Ambiente, on_delete=models.CASCADE)

    def __str__(self):
        return f"{self.codigo} - {self.ambiente.nombre}"

class Piso(models.Model):
    numero = models.IntegerField()
    estante = models.ForeignKey(Estante, on_delete=models.CASCADE)

    def __str__(self):
        return f"Piso {self.numero} - {self.estante}"

class Carpeta(models.Model):
    ESTADOS = [
        ('disponible', 'Disponible'),
        ('prestada', 'Prestada'),
        ('extraviada', 'Extraviada'),
    ]
    codigo_carpeta = models.CharField(max_length=50, unique=True)
    estudiante = models.ForeignKey(Estudiante, on_delete=models.CASCADE)
    piso = models.ForeignKey(Piso, on_delete=models.CASCADE)
    estado = models.CharField(max_length=50, default='disponible', choices=ESTADOS)
    observaciones = models.TextField(blank=True, null=True)

    def __str__(self):
        return self.codigo_carpeta

class Documento(models.Model):
    carpeta = models.ForeignKey(Carpeta, on_delete=models.CASCADE)
    tipo_documento = models.CharField(max_length=50)
    nombre_documento = models.CharField(max_length=200, blank=True, null=True)
    fecha_emision = models.DateField(blank=True, null=True)
    observaciones = models.TextField(blank=True, null=True)

    def __str__(self):
        return f"{self.tipo_documento} - {self.carpeta.codigo_carpeta}"

class Solicitante(models.Model):
    TIPOS = [
        ('estudiante', 'Estudiante'),
        ('administrativo', 'Administrativo'),
        ('externo', 'Externo'),
    ]
    tipo = models.CharField(max_length=50, choices=TIPOS)
    nombre_completo = models.CharField(max_length=200)
    identificacion = models.CharField(max_length=50, unique=True)
    telefono = models.CharField(max_length=20, blank=True, null=True)
    email = models.EmailField(max_length=100, blank=True, null=True)
    direccion = models.CharField(max_length=255, blank=True, null=True)
    estudiante_referencia = models.ForeignKey(Estudiante, on_delete=models.SET_NULL, null=True, blank=True)

    def __str__(self):
        return self.nombre_completo

class Prestamo(models.Model):
    ESTADOS = [
        ('activo', 'Activo'),
        ('devuelto', 'Devuelto'),
        ('vencido', 'Vencido'),
    ]
    carpeta = models.ForeignKey(Carpeta, on_delete=models.CASCADE)
    usuario = models.ForeignKey(User, on_delete=models.CASCADE)
    autoridad = models.ForeignKey(Autoridad, on_delete=models.CASCADE)
    solicitante = models.ForeignKey(Solicitante, on_delete=models.CASCADE)
    fecha_prestamo = models.DateField()
    fecha_limite_devolucion = models.DateField()
    fecha_devolucion_real = models.DateField(blank=True, null=True)
    estado = models.CharField(max_length=20, default='activo', choices=ESTADOS)
    observaciones = models.TextField(blank=True, null=True)

class Prorroga(models.Model):
    prestamo = models.ForeignKey(Prestamo, on_delete=models.CASCADE)
    autoridad = models.ForeignKey(Autoridad, on_delete=models.CASCADE)
    fecha_solicitud = models.DateField()
    nueva_fecha_limite = models.DateField()
    motivo = models.CharField(max_length=255, blank=True, null=True)

class Bloqueo(models.Model):
    solicitante = models.ForeignKey(Solicitante, on_delete=models.CASCADE)
    prestamo_origen = models.ForeignKey(Prestamo, on_delete=models.CASCADE)
    fecha_bloqueo = models.DateField()
    motivo = models.CharField(max_length=255, blank=True, null=True)
    activo = models.BooleanField(default=True)
    autoridad_desbloqueo = models.ForeignKey(Autoridad, on_delete=models.SET_NULL, null=True, blank=True)
    fecha_desbloqueo_manual = models.DateField(blank=True, null=True)

class IncidenteCarpeta(models.Model):
    prestamo = models.ForeignKey(Prestamo, on_delete=models.CASCADE)
    usuario = models.ForeignKey(User, on_delete=models.CASCADE)
    tipo_incidente = models.CharField(max_length=50)
    fecha_reporte = models.DateField()
    descripcion = models.TextField(blank=True, null=True)
    plazo_reposicion_dias = models.IntegerField(blank=True, null=True)
    observaciones = models.TextField(blank=True, null=True)


