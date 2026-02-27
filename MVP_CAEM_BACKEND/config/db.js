const { Pool } = require('pg');

const connectionString = process.env.DATABASE_URL;

const pool = new Pool({
  connectionString,
  ssl: process.env.NODE_ENV === 'production'
    ? { rejectUnauthorized: false }
    : false,
});

module.exports = {
  query: (text, params) => pool.query(text, params),

  connect: async () => {
    try {
      await pool.query('SELECT 1');
      return true;
    } catch (err) {
      throw err;
    }
  },
};