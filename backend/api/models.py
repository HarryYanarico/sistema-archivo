from django.db import models
from django.contrib.auth.models import User

class Persona(models.Model):
    ci = models.CharField(max_length=20, unique=True)
    nombre = models.CharField(max_length=100)
    apellido = models.CharField(max_length=100)
    telefono = models.CharField(max_length=20, blank=True, null=True)
    email = models.EmailField(max_length=100, blank=True, null=True)
    direccion = models.CharField(max_length=255, blank=True, null=True)
    fecha_naci = models.DateField(blank=True, null=True)
    cargo = models.CharField(max_length=100, blank=True, null=True)

    def __str__(self):
        return f"{self.nombre} {self.apellido}"

class Ambiente(models.Model):
    nombre = models.CharField(max_length=100)
    ubicacion = models.CharField(max_length=100, blank=True, null=True)
    descripcion = models.CharField(max_length=255, blank=True, null=True)

    def __str__(self):
        return self.nombre

class Estante(models.Model):
    codigo = models.CharField(max_length=50)
    numero = models.IntegerField(blank=True, null=True)
    descripcion = models.CharField(max_length=255, blank=True, null=True)
    estado = models.CharField(max_length=20, blank=True, null=True)
    ambiente = models.ForeignKey(Ambiente, on_delete=models.CASCADE)

    def __str__(self):
        return f"Estante {self.codigo}"

class Piso(models.Model):
    nro_fila = models.IntegerField()
    descripcion = models.CharField(max_length=255, blank=True, null=True)
    capacidad_max = models.IntegerField(blank=True, null=True)
    estante = models.ForeignKey(Estante, on_delete=models.CASCADE)

    def __str__(self):
        return f"Piso {self.nro_fila} - {self.estante.codigo}"

class Carpeta(models.Model):
    descripcion = models.CharField(max_length=255, blank=True, null=True)
    fecha_crea = models.DateField(auto_now_add=True)
    estado = models.BooleanField(default=True)
    piso = models.ForeignKey(Piso, on_delete=models.CASCADE)

    def __str__(self):
        return f"Carpeta {self.id} - {self.descripcion}"

class Documento(models.Model):
    codigo_doc = models.CharField(max_length=50)
    titulo = models.CharField(max_length=150)
    tipo_doc = models.CharField(max_length=50)
    fecha_ingre = models.DateField(auto_now_add=True)
    carpeta = models.ForeignKey(Carpeta, on_delete=models.CASCADE)

    def __str__(self):
        return self.titulo

class Incidente(models.Model):
    tipo_inci = models.CharField(max_length=50)
    fecha_reporte = models.DateField(auto_now_add=True)
    estado = models.BooleanField(default=True)
    usuario = models.ForeignKey(User, on_delete=models.CASCADE)

    def __str__(self):
        return f"Incidente {self.id} - {self.tipo_inci}"

class DetalleIncidente(models.Model):
    descripcion = models.CharField(max_length=255, blank=True, null=True)
    incidente = models.ForeignKey(Incidente, on_delete=models.CASCADE)
    carpeta = models.ForeignKey(Carpeta, on_delete=models.CASCADE)

    def __str__(self):
        return f"Detalle Incidente {self.incidente.id}"

class Bloqueo(models.Model):
    fecha_bloq = models.DateField(auto_now_add=True)
    motivo_bloq = models.CharField(max_length=255)
    fecha_desbloq = models.DateField(blank=True, null=True)
    usuario = models.ForeignKey(User, on_delete=models.CASCADE)
    persona = models.ForeignKey(Persona, on_delete=models.CASCADE, null=True, blank=True)

    def __str__(self):
        return f"Bloqueo {self.id} - {self.usuario.username} bloqueó a {self.persona}"

class PrestamoCarpeta(models.Model):
    prestamo = models.ForeignKey('Prestamo', on_delete=models.CASCADE)
    carpeta = models.ForeignKey(Carpeta, on_delete=models.CASCADE)
    fecha_devol = models.DateField(blank=True, null=True)
    estado = models.CharField(max_length=20, default='prestado')
    observaciones = models.CharField(max_length=255, blank=True, null=True)

    def __str__(self):
        return f"Prestamo {self.prestamo_id} - Carpeta {self.carpeta_id}"

class Prestamo(models.Model):
    fecha_prest = models.DateField(auto_now_add=True)
    fecha_limite = models.DateField()
    observaciones = models.CharField(max_length=255, blank=True, null=True)
    persona = models.ForeignKey(Persona, on_delete=models.CASCADE, related_name='prestamos_recibidos')
    usuario = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='prestamos_registrados')
    autorizado_por = models.ForeignKey(Persona, on_delete=models.SET_NULL, null=True, blank=True, related_name='prestamos_autorizados')
    carpetas = models.ManyToManyField(Carpeta, through='PrestamoCarpeta', related_name='prestamos')

    def __str__(self):
        return f"Prestamo {self.id} - {self.persona}"

class Prorroga(models.Model):
    fecha_solici = models.DateField(auto_now_add=True)
    dias_solicit = models.IntegerField()
    estado = models.CharField(max_length=20)
    fecha_aprobado = models.DateField(blank=True, null=True)
    motivo = models.CharField(max_length=255, blank=True, null=True)
    prestamo = models.ForeignKey(Prestamo, on_delete=models.CASCADE)

    def __str__(self):
        return f"Prorroga {self.id} - Prestamo {self.prestamo.id}"

class Perfil(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    secreto_2fa = models.CharField(max_length=32, blank=True, null=True)
    is_2fa_enabled = models.BooleanField(default=False)

    def __str__(self):
        return self.user.username