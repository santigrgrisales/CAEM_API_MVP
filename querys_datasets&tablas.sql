-- EXTENSION
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- LIMPIEZA TOTAL
DROP TABLE IF EXISTS procesos_banco CASCADE;

-- CREACIÓN TABLA
CREATE TABLE procesos_banco (
  
  -- Identificación
  case_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  embargo_id BIGINT NOT NULL,

  -- Banco autenticado
  entidad_bancaria_id INTEGER NOT NULL REFERENCES banks(id),

  -- Proceso
  numero_oficio TEXT,
  fecha_oficio DATE,
  fecha_recepcion DATE,
  titulo_embargo TEXT,
  titulo_orden TEXT,
  monto NUMERIC,
  monto_a_embargar NUMERIC,
  estado_embargo TEXT NOT NULL,

  -- Demandado
  nombre_demandado TEXT NOT NULL,
  id_demandado TEXT NOT NULL,
  tipo_id_demandado TEXT NOT NULL,

  -- Demandante
  nombre_demandante TEXT,
  id_demandante TEXT,
  tipo_id_demandante TEXT,

  -- Remitente
  nombre_remitente TEXT,
  direccion_remitente TEXT,
  correo_remitente TEXT,
  nombre_personal_remitente TEXT,

  -- Control técnico
  fingerprint TEXT NOT NULL UNIQUE,
  estado_logico VARCHAR(20) NOT NULL DEFAULT 'ACTIVO',

  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ÍNDICES
CREATE INDEX idx_procesos_banco
ON procesos_banco(entidad_bancaria_id);

CREATE INDEX idx_procesos_estado
ON procesos_banco(estado_logico);







INSERT INTO procesos_banco (
  embargo_id,
  entidad_bancaria_id,
  estado_embargo,

  numero_oficio,
  fecha_oficio,
  fecha_recepcion,
  titulo_embargo,
  titulo_orden,
  monto,
  monto_a_embargar,

  nombre_demandado,
  id_demandado,
  tipo_id_demandado,

  nombre_demandante,
  id_demandante,
  tipo_id_demandante,

  nombre_remitente,
  direccion_remitente,
  correo_remitente,
  nombre_personal_remitente,

  fingerprint
)
SELECT
  e.id,
  e.entidad_bancaria_id,
  e.estado_embargo,

  COALESCE(e.oficio, e.radicado_banco),
  e.fecha_oficio,
  e.fecha_recibido,
  e.tipo_embargo,
  e.tipo_documento,
  d.monto_embargado,
  d.montoaembargar,

  d.nombres,
  d.identificacion,
  d.tipo_identificacion_tipo,

  dm.nombres,
  dm.identificacion,
  dm.tipo_identificacion_tipo,

  e.entidad_remitente,
  e.direccion,
  e.correo,
  e.funcionario,

  encode(
    digest(
      COALESCE(e.id::text, '') || '-' ||
      COALESCE(e.entidad_bancaria_id::text, '') || '-' ||
      COALESCE(d.identificacion, '') || '-' ||
      COALESCE(d.montoaembargar::text, ''),
      'sha256'
    ),
    'hex'
  )

FROM embargos e
JOIN demandado d ON d.embargo_id = e.id
LEFT JOIN demandante dm ON dm.embargo_id = e.id
WHERE e.deleted = FALSE

ON CONFLICT (fingerprint) DO NOTHING;


--agregacion campo ciudad

alter table procesos_banco add column ciudad text;

update procesos_banco pb set ciudad = e.ciudad from embargos e where pb.embargo_id = e.id;


