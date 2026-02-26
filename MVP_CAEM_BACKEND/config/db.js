const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'embargos_test',
  password: '1234',
  port: 5432,
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  connect: async () => {
    try {
      await pool.connect();
      return true;
    } catch (err) {
      throw err;
    }
  }
};