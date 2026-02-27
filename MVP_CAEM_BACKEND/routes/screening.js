// routes/screening.js
const express = require('express');
const router = express.Router();
const db = require('../config/db');

// GET /api/screening
// Headers: x-api-key OR Authorization: Bearer <jwt>
// Query params: ?limit=100&offset=0&fecha_desde=2023-01-01&fecha_hasta=2023-05-30
router.get('/', async (req, res) => {
  try {
    const bankId = req.bank && req.bank.id;
    if (!bankId) return res.status(401).json({ error: 'Bank not identified' });

    // Params with defaults and safety caps
    const limit = Math.min(parseInt(req.query.limit || '5000', 10), 50000);
    const offset = Math.max(parseInt(req.query.offset || '0', 10), 0);
    const fecha_desde = req.query.fecha_desde || null;
    const fecha_hasta = req.query.fecha_hasta || null;

    // Build query dynamically but parameterized
   let q = `
  SELECT
    case_id,
    tipo_id_demandado,
    id_demandado,
    titulo_orden AS tipo_orden,
    fecha_recepcion,
    nombre_demandante AS demandante
  FROM procesos_banco
  WHERE entidad_bancaria_id = $1
  AND estado_logico = 'ACTIVO'
`;
    const params = [bankId];

    if (fecha_desde) {
      params.push(fecha_desde);
      q += ` AND fecha_recepcion >= $${params.length}`;
    }
    if (fecha_hasta) {
      params.push(fecha_hasta);
      q += ` AND fecha_recepcion <= $${params.length}`;
    }

    params.push(limit);
    q += ` ORDER BY fecha_recepcion DESC NULLS LAST LIMIT $${params.length}`;
    params.push(offset);
    q += ` OFFSET $${params.length}`;

    const result = await db.query(q, params);

    // devolver los datos tal cual; campos numéricos mínimos serán convertidos si se necesita
    res.json(result.rows);
  } catch (err) {
    console.error('Screening error', err);
    res.status(500).json({ error: 'Database error' });
  }
});

module.exports = router;