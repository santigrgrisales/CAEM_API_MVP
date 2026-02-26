
const db = require('../config/db');

const MAX_BATCH = 500; // cambiar si es necesario

async function getCasesByIdsForBank(bankId, caseIds = []) {
  if (!Array.isArray(caseIds)) throw new Error('case_ids must be an array');
  if (caseIds.length === 0) return { rows: [], not_found: [] };
  if (caseIds.length > MAX_BATCH) throw new Error(`Too many case_ids. Max ${MAX_BATCH}`);




  // query ---> obtener todos los casos que pertenezcan al banco
  const q = `
    SELECT *
    FROM procesos_banco
    WHERE entidad_bancaria_id = $1
    AND case_id = ANY($2::uuid[])
    AND estado_logico = 'ACTIVO';
  `;
  const { rows } = await db.query(q, [bankId, caseIds]);

  // Calc not_found
  const foundIds = new Set(rows.map(r => String(r.case_id)));
  const not_found = caseIds.filter(id => !foundIds.has(String(id)));

  return { rows, not_found };
}

module.exports = {
  getCasesByIdsForBank,
  MAX_BATCH
};