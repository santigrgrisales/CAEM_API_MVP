// tools/generate_token.js
// Uso: node tools/generate_token.js 2
// Devuelve un JWT para bank_id = 2 (modifica tiempo de expiración según necesites)
require('dotenv').config();
const jwt = require('jsonwebtoken');

const bankId = Number(process.argv[2] || process.env.TEST_BANK_ID || 2);
const payload = { bank_id: bankId, iat: Math.floor(Date.now() / 1000) };

const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '12h' });
console.log(token);