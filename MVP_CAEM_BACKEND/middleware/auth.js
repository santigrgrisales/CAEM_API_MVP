// middleware/auth.js
const jwt = require('jsonwebtoken');
require('dotenv').config();
const db = require('../config/db'); // tu pool / cliente pg

/**
 * Autenticación híbrida:
 * 1) Primero intenta x-api-key header (recomendado para bancos)
 * 2) Si no existe, intenta Authorization: Bearer <jwt>
 * En ambos casos setea req.bank = { id, name, ... }
 */
const authenticate = async (req, res, next) => {
  try {
    // Primero: x-api-key (más simple para pruebas)
    const apiKey = req.header('x-api-key');
    if (apiKey) {
      const { rows } = await db.query(
        'SELECT id, name, code, is_active FROM banks WHERE api_key = $1 AND is_active = true',
        [apiKey]
      );
      if (rows.length === 0) {
        return res.status(403).json({ error: 'Invalid API key' });
      }
      req.bank = rows[0];
      return next();
    }

    // Segundo: Authorization Bearer JWT
    const authHeader = req.header('Authorization') || '';
    if (!authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authentication required (x-api-key or Bearer token)' });
    }

    const token = authHeader.slice(7);
    let payload;
    try {
      payload = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return res.status(403).json({ error: 'Invalid token' });
    }

    // payload debe contener bank_id o similar
    if (!payload.bank_id) {
      return res.status(401).json({ error: 'Token missing bank_id' });
    }

    const { rows } = await db.query(
      'SELECT id, name, code, is_active FROM banks WHERE id = $1 AND is_active = true',
      [payload.bank_id]
    );
    if (rows.length === 0) {
      return res.status(403).json({ error: 'Bank not found or inactive' });
    }

    req.bank = rows[0];
    next();
  } catch (err) {
    console.error('Auth error', err);
    res.status(500).json({ error: 'Authentication error' });
  }
};

module.exports = authenticate;