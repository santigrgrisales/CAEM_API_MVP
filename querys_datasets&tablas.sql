CREATE TABLE embargos (
  id BIGINT PRIMARY KEY,
  deleted BOOLEAN,
  ciudad TEXT,
  confirmed_at TIMESTAMP NULL,
  correo TEXT,
  corte INTEGER,
  create_at TIMESTAMP,
  cuenta TEXT,
  direccion TEXT,
  downloaded BOOLEAN,
  embargo_path TEXT,
  entidad_remitente TEXT,
  estado_embargo TEXT,
  fecha_banco DATE NULL,
  fecha_oficio DATE NULL,
  fecha_recibido DATE NULL,
  funcionario TEXT,
  is_special BOOLEAN,
  modify_at TIMESTAMP NULL,
  observaciones TEXT,
  oficio TEXT,
  original_name_file TEXT,
  process_error TEXT,
  processed_at TIMESTAMP NULL,
  radicado_banco TEXT,
  referencia TEXT,
  response_path TEXT,
  tipo_documento TEXT,
  tipo_embargo TEXT,
  tipo_respuesta TEXT,
  assigned_to INTEGER,
  confirmed_by NUMERIC,
  create_by_user INTEGER,
  entidad_bancaria_id INTEGER,
  codigo_alcance INTEGER,
  secondary_id INTEGER,
  correo_fue_actualizado BOOLEAN
);




CREATE TABLE demandado (
  id BIGSERIAL PRIMARY KEY,
  embargabilidad BOOLEAN,
  es_cliente BOOLEAN,
  estado TEXT,
  expediente TEXT,
  fecha_procesamiento TIMESTAMP NULL,
  identificacion TEXT,
  montoaembargar NUMERIC,
  monto_embargado NUMERIC,
  nombres TEXT,
  page INTEGER,
  tipo_carta TEXT,
  embargo_id BIGINT,
  notification_group_id NUMERIC,
  tipo_identificacion_tipo TEXT
);



SELECT COUNT(*)
FROM demandado d
LEFT JOIN embargos e
  ON d.embargo_id = e.id
WHERE e.id IS NULL;


CREATE INDEX idx_demandado_embargo_id
ON demandado(embargo_id);



CREATE EXTENSION IF NOT EXISTS "pgcrypto";



--drop TABLE procesos_banco;



CREATE TABLE procesos_banco AS
SELECT
  gen_random_uuid() AS case_id,
  e.id AS embargo_id,
  d.tipo_identificacion_tipo AS tipo_id_demandado,
  d.identificacion AS id_demandado,
  d.nombres AS nombre_demandado,
  e.tipo_documento AS tipo_orden,
  e.tipo_embargo,
  e.fecha_recibido AS fecha_recepcion,
  e.fecha_oficio,
  e.entidad_remitente,
  e.estado_embargo,
  e.ciudad,
  e.oficio,
  e.radicado_banco,
  d.montoaembargar AS monto_a_embargar,
  d.monto_embargado
FROM embargos e
JOIN demandado d
  ON d.embargo_id = e.id
WHERE e.deleted = FALSE;



--Corrección-->ALTER TABLE procesos_banco
ALTER TABLE procesos_banco
ADD COLUMN entidad_bancaria_id INTEGER;  
ALTER TABLE procesos_banco
ADD COLUMN banco_nombre TEXT;


UPDATE procesos_banco p
SET entidad_bancaria_id = e.entidad_bancaria_id,
    banco_nombre = (CASE WHEN e.entidad_bancaria_id IS NOT NULL THEN CAST(e.entidad_bancaria_id AS TEXT) ELSE NULL END)
FROM embargos e
WHERE p.embargo_id = e.id;



--drop table banks

--Mapeo Bancos
CREATE TABLE banks (
  id SERIAL PRIMARY KEY,
  code INTEGER,           
  name TEXT NOT NULL,
  api_key TEXT UNIQUE,
  is_active BOOLEAN DEFAULT TRUE
);

--inserts de prueba
INSERT INTO banks (code, name, api_key) VALUES
  (1, 'BANCO_1', 'test_key_bancox_1'),
  (2, 'BANCO_2', 'test_key_bancoy_2'),
  (3, 'BANCO_3', 'test_key_bancoy_3');
  (4, 'BANCO_4', 'test_key_bancoy_4');
  (5, 'BANCO_5', 'test_key_bancoy_5');

UPDATE procesos_banco p
SET entidad_bancaria_id = b.id,
    banco_nombre = b.name
FROM embargos e
JOIN banks b ON e.entidad_bancaria_id = b.code
WHERE p.embargo_id = e.id;



SELECT COUNT(*) FROM procesos_banco;

CREATE INDEX IF NOT EXISTS idx_procesos_banco_entidad ON procesos_banco(entidad_bancaria_id);
CREATE INDEX IF NOT EXISTS idx_procesos_banco_case ON procesos_banco(case_id);


-------xxxxxxxx------------
----Manejo de duplicados

ALTER TABLE procesos_banco
ADD COLUMN fingerprint TEXT;

UPDATE procesos_banco
SET fingerprint = encode(
  digest(
    concat_ws('|',
      entidad_bancaria_id,
      tipo_id_demandado,
      id_demandado,
      tipo_orden,
      tipo_embargo,
      monto_a_embargar,
      entidad_remitente,
      fecha_oficio
    ),
    'sha256'
  ),
  'hex'
);


---ver duplicados actuales --->
SELECT fingerprint, COUNT(*)
FROM procesos_banco
GROUP BY fingerprint
HAVING COUNT(*) > 1;


------
ALTER TABLE procesos_banco
ADD COLUMN IF NOT EXISTS estado_logico VARCHAR(20) DEFAULT 'ACTIVO';

-----
WITH ranked AS (
  SELECT
    case_id,
    fingerprint,
    ROW_NUMBER() OVER (
      PARTITION BY fingerprint
      ORDER BY fecha_recepcion ASC
    ) AS rn
  FROM procesos_banco
)
UPDATE procesos_banco pb
SET estado_logico = 'DUPLICADO'
FROM ranked r
WHERE pb.case_id = r.case_id
AND r.rn > 1;



SELECT fingerprint, COUNT(*)
FROM procesos_banco
WHERE estado_logico = 'ACTIVO'
GROUP BY fingerprint
HAVING COUNT(*) > 1;

CREATE UNIQUE INDEX uq_procesos_banco_fingerprint
ON procesos_banco (fingerprint)
WHERE estado_logico = 'ACTIVO';
--------------xxxxxxxxxxxxxx--------------------------





-----------------------------------------------------------------------------

----Pruebas Endpoints 

--Screening---EndpointI ----->
SELECT
  case_id,
  tipo_id_demandado,
  id_demandado,
  tipo_orden,
  fecha_recepcion,
  entidad_remitente
FROM procesos_banco
LIMIT 10;



--¿Una persona tiene múltiples procesos?
SELECT id_demandado, COUNT(*)
FROM procesos_banco
GROUP BY id_demandado
HAVING COUNT(*) > 1;



--verificar campos criticos
SELECT *
FROM procesos_banco
WHERE id_demandado IS NULL
   OR tipo_id_demandado IS NULL
   OR case_id IS NULL;


SELECT COUNT(*) FROM procesos_banco;



--Endpoint II - Respuesta a la consulta sobre el case_id---->




--prueba:
SELECT *
FROM procesos_banco
WHERE case_id IN (
  '3156e80c-bb42-44ec-989e-281dca012d7c',
  '9a554771-510e-45d1-8605-535bc2e23f24'
);





CREATE INDEX idx_procesos_case_id
ON procesos_banco(case_id);
   

