// routes/case.js
const express = require('express');
const router = express.Router();
const db = require('../config/db');

// GET /api/case/:case_id
// Devuelve detalle completo del case_id, **solo si** pertenece al banco autenticado
router.get('/:case_id', async (req, res) => {
  try {
    const bankId = req.bank && req.bank.id;
    if (!bankId) return res.status(401).json({ error: 'Bank not identified' });

    const { case_id } = req.params;
    const { rows } = await db.query('SELECT * FROM procesos_banco WHERE case_id = $1', [case_id]);

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Case not found' });
    }

    const row = rows[0];

    // Control de ownership: sólo el banco dueño puede verlo
    if (row.entidad_bancaria_id === null || row.entidad_bancaria_id !== bankId) {
      // Si no pertenece al banco -> 403
      return res.status(403).json({ error: 'Forbidden: case not accessible by this bank' });
    }

    // Normalizar tipos: convertir montos a number (si vinieron como strings)
    if (row.monto_a_embargar !== null) row.monto_a_embargar = Number(row.monto_a_embargar);
    if (row.monto_embargado !== null) row.monto_embargado = Number(row.monto_embargado);

    res.json(row);
  } catch (err) {
    console.error('Case error', err);
    res.status(500).json({ error: 'Database error' });
  }
});

module.exports = router;