-- Script SQL para el Sistema de Archivo
-- Este script muestra la estructura de las tablas y sus relaciones

-- Tabla: Persona
CREATE TABLE api_persona (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ci VARCHAR(20) UNIQUE NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    apellido VARCHAR(100) NOT NULL,
    telefono VARCHAR(20),
    email VARCHAR(100),
    direccion VARCHAR(255),
    fecha_naci DATE,
    cargo VARCHAR(100),
    usuario_id INTEGER UNIQUE REFERENCES auth_user(id) ON DELETE SET NULL
);

-- Tabla: Ambiente
CREATE TABLE api_ambiente (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre VARCHAR(100) NOT NULL,
    ubicacion VARCHAR(100),
    descripcion VARCHAR(255)
);

-- Tabla: Estante
CREATE TABLE api_estante (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    codigo VARCHAR(50) NOT NULL,
    numero INTEGER,
    descripcion VARCHAR(255),
    estado VARCHAR(20),
    ambiente_id INTEGER NOT NULL REFERENCES api_ambiente(id) ON DELETE CASCADE
);

-- Tabla: Piso
CREATE TABLE api_piso (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nro_fila INTEGER NOT NULL,
    descripcion VARCHAR(255),
    capacidad_max INTEGER,
    estante_id INTEGER NOT NULL REFERENCES api_estante(id) ON DELETE CASCADE
);

-- Tabla: Carpeta
CREATE TABLE api_carpeta (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    descripcion VARCHAR(255),
    fecha_crea DATE NOT NULL DEFAULT CURRENT_DATE,
    estado BOOLEAN NOT NULL DEFAULT 1,
    piso_id INTEGER NOT NULL REFERENCES api_piso(id) ON DELETE CASCADE
);

-- Tabla: Documento
CREATE TABLE api_documento (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    codigo_doc VARCHAR(50) NOT NULL,
    titulo VARCHAR(150) NOT NULL,
    tipo_doc VARCHAR(50) NOT NULL,
    fecha_ingre DATE NOT NULL DEFAULT CURRENT_DATE,
    carpeta_id INTEGER NOT NULL REFERENCES api_carpeta(id) ON DELETE CASCADE
);

-- Tabla: Incidente
CREATE TABLE api_incidente (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tipo_inci VARCHAR(50) NOT NULL,
    fecha_reporte DATE NOT NULL DEFAULT CURRENT_DATE,
    estado BOOLEAN NOT NULL DEFAULT 1,
    usuario_id INTEGER NOT NULL REFERENCES auth_user(id) ON DELETE CASCADE
);

-- Tabla: DetalleIncidente (Relación muchos a muchos entre Incidente y Carpeta)
CREATE TABLE api_detalleincidente (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    descripcion VARCHAR(255),
    incidente_id INTEGER NOT NULL REFERENCES api_incidente(id) ON DELETE CASCADE,
    carpeta_id INTEGER NOT NULL REFERENCES api_carpeta(id) ON DELETE CASCADE
);

-- Tabla: Bloqueo
CREATE TABLE api_bloqueo (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    fecha_bloq DATE NOT NULL DEFAULT CURRENT_DATE,
    motivo_bloq VARCHAR(255) NOT NULL,
    fecha_desbloq DATE,
    usuario_id INTEGER NOT NULL REFERENCES auth_user(id) ON DELETE CASCADE,
    persona_id INTEGER REFERENCES api_persona(id) ON DELETE CASCADE
);

-- Tabla: Prestamo
CREATE TABLE api_prestamo (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    fecha_prest DATE NOT NULL DEFAULT CURRENT_DATE,
    fecha_devol DATE,
    fecha_limite DATE NOT NULL,
    estado VARCHAR(20) NOT NULL,
    observaciones VARCHAR(255),
    persona_id INTEGER NOT NULL REFERENCES api_persona(id) ON DELETE CASCADE
);

-- Tabla intermedia: PrestamoCarpeta (Relación muchos a muchos entre Prestamo y Carpeta)
CREATE TABLE api_prestamo_carpetas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    prestamo_id INTEGER NOT NULL REFERENCES api_prestamo(id) ON DELETE CASCADE,
    carpeta_id INTEGER NOT NULL REFERENCES api_carpeta(id) ON DELETE CASCADE,
    UNIQUE(prestamo_id, carpeta_id)
);

-- Tabla: Prorroga
CREATE TABLE api_prorroga (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    fecha_solici DATE NOT NULL DEFAULT CURRENT_DATE,
    dias_solicit INTEGER NOT NULL,
    estado VARCHAR(20) NOT NULL,
    fecha_aprobado DATE,
    motivo VARCHAR(255),
    prestamo_id INTEGER NOT NULL REFERENCES api_prestamo(id) ON DELETE CASCADE
);

-- Índices para mejorar rendimiento en las relaciones
CREATE INDEX idx_estante_ambiente ON api_estante(ambiente_id);
CREATE INDEX idx_piso_estante ON api_piso(estante_id);
CREATE INDEX idx_carpeta_piso ON api_carpeta(piso_id);
CREATE INDEX idx_documento_carpeta ON api_documento(carpeta_id);
CREATE INDEX idx_detalleincidente_incidente ON api_detalleincidente(incidente_id);
CREATE INDEX idx_detalleincidente_carpeta ON api_detalleincidente(carpeta_id);
CREATE INDEX idx_prestamo_persona ON api_prestamo(persona_id);
CREATE INDEX idx_prestamo_carpetas_prestamo ON api_prestamo_carpetas(prestamo_id);
CREATE INDEX idx_prestamo_carpetas_carpeta ON api_prestamo_carpetas(carpeta_id);
CREATE INDEX idx_prorroga_prestamo ON api_prorroga(prestamo_id);
CREATE INDEX idx_persona_usuario ON api_persona(usuario_id);

-- Comentarios sobre las relaciones:
-- 1. Ambiente 1:N Estante (Un ambiente tiene muchos estantes)
-- 2. Estante 1:N Piso (Un estante tiene muchos pisos)
-- 3. Piso 1:N Carpeta (Un piso tiene muchas carpetas)
-- 4. Carpeta 1:N Documento (Una carpeta tiene muchos documentos)
-- 5. Incidente 1:N DetalleIncidente (Un incidente tiene muchos detalles)
-- 6. DetalleIncidente N:1 Carpeta (Muchos detalles pueden referenciar una carpeta)
-- 7. Prestamo N:M Carpeta (Muchos préstamos pueden tener muchas carpetas a través de api_prestamo_carpetas)
-- 8. Prestamo 1:N Prorroga (Un préstamo puede tener muchas prórrogas)
-- 9. Persona 1:N Prestamo (Una persona puede tener muchos préstamos)
-- 10. User 1:1 Persona (Un usuario está asociado a una persona)
-- 11. User 1:N Bloqueo (Un usuario puede bloquear a muchas personas)
-- 12. Persona 1:N Bloqueo (Una persona puede tener muchos bloqueos)
