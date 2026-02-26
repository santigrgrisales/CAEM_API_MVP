// src/index.js
require('dotenv').config();
const express = require('express');
const app = express();
const db = require('../config/db'); // tu módulo DB (pool)
const authenticate = require('../middleware/auth');

// Middleware
app.use(express.json());

// Import routes
const screeningRoutes = require('../routes/screening');
const caseRoutes = require('../routes/case');

// Routes (el middleware auth ya valida el banco)
app.use('/api/screening', authenticate, screeningRoutes);
app.use('/api/case', authenticate, caseRoutes);

// Start server after DB ready (si tu db.connect devuelve promesa)
const start = async () => {
  try {
    if (typeof db.connect === 'function') {
      await db.connect();
    }
    console.log('Database connected');

    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error('Database connection failed', err);
    process.exit(1);
  }
};

start();