
const express = require('express');
const router = express.Router();
const { getCasesByIdsForBank, MAX_BATCH } = require('../services/casesService');

function toNumberIfPossible(v) {
  if (v === null || v === undefined) return null;
  if (typeof v === 'number') return v;
  const n = Number(v);
  return Number.isNaN(n) ? v : n;
}

router.post('/batch', async (req, res) => {
  try {
    const bankId = req.bank && req.bank.id;
    if (!bankId) return res.status(401).json({ error: 'Bank not identified' });

    const { case_ids } = req.body;
    if (!Array.isArray(case_ids) || case_ids.length === 0) {
      return res.status(400).json({ error: 'case_ids must be a non-empty array' });
    }
    if (case_ids.length > MAX_BATCH) {
      return res.status(400).json({ error: `Too many case_ids. Max ${MAX_BATCH}` });
    }

    const { rows, not_found } = await getCasesByIdsForBank(bankId, case_ids);

    // Map rows -> estructura por categorías solicitada
    const results = rows.map(row => {
      return {
        case_id: row.case_id,
        proceso: {
          id: row.embargo_id ?? null,
          numero_oficio: (row.oficio || row.radicado_banco || null),
          fecha_oficio: row.fecha_oficio ? row.fecha_oficio : null,
          fecha_recepcion: row.fecha_recepcion ? row.fecha_recepcion : null,
          titulo_embargo: row.tipo_embargo ?? null,
          titulo_orden: row.tipo_orden ?? null,
          monto: toNumberIfPossible(row.monto_embargado),
          monto_a_embargar: toNumberIfPossible(row.monto_a_embargar)
        },
        demandado: {
          nombre: row.nombre_demandado ?? null,
          documento: row.id_demandado ?? null,
          tipo_documento: row.tipo_id_demandado ?? null
        },
        demandante: {
          nombre: row.nombre_demandante ?? null,
          documento: row.id_demandante ?? null,
          tipo_documento: row.tipo_id_demandante ?? null
        },
        remitente: {
          nombre: row.entidad_remitente ?? null,
          direccion: row.direccion_remitente ?? null,
          correo_electronico: row.correo_remitente ?? null,
          nombre_personal: row.nombre_remitente ?? null
        }
        
      };
    });

    res.json({ results, not_found });
  } catch (err) {
    console.error('Batch cases error', err);
    if (err.message && err.message.includes('Too many case_ids')) {
      return res.status(400).json({ error: err.message });
    }
    res.status(500).json({ error: 'Database error' });
  }
});

module.exports = router;