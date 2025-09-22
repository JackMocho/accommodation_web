require('dotenv').config();
const { Pool } = require('pg');

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is required in environment (.env).');
}

// Use SSL when PGSSLMODE is not "disable" (helpful for hosted Postgres)
const useSSL = process.env.PGSSLMODE !== 'disable' && (process.env.NODE_ENV === 'production' || process.env.PGSSLMODE === 'require');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: useSSL ? { rejectUnauthorized: false } : false,
});

async function query(text, params = []) {
  return pool.query(text, params);
}

function _buildWhere(conditions = {}, startIndex = 1) {
  const keys = Object.keys(conditions || {});
  if (keys.length === 0) return { clause: '', params: [], nextIndex: startIndex };
  const parts = [];
  const params = [];
  let idx = startIndex;
  for (const k of keys) {
    parts.push(`"${k}" = $${idx}`);
    params.push(conditions[k]);
    idx++;
  }
  return { clause: 'WHERE ' + parts.join(' AND '), params, nextIndex: idx };
}

async function findBy(table, conditions = {}, columns = '*') {
  const { clause, params } = _buildWhere(conditions);
  const text = `SELECT ${columns} FROM "${table}" ${clause};`;
  const res = await query(text, params);
  return res.rows;
}

async function findOne(table, conditions = {}, columns = '*') {
  const rows = await findBy(table, conditions, columns);
  return rows[0] || null;
}

async function insert(table, data = {}, returning = '*') {
  const keys = Object.keys(data || {});
  const vals = Object.values(data || {});
  if (keys.length === 0) {
    const text = `INSERT INTO "${table}" DEFAULT VALUES RETURNING ${returning};`;
    const res = await query(text, []);
    return res.rows[0];
  }
  const cols = keys.map(k => `"${k}"`).join(', ');
  const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');
  const text = `INSERT INTO "${table}" (${cols}) VALUES (${placeholders}) RETURNING ${returning};`;
  const res = await query(text, vals);
  return res.rows[0];
}

async function update(table, conditions = {}, data = {}, returning = '*') {
  const setKeys = Object.keys(data || {});
  const setVals = Object.values(data || {});
  if (setKeys.length === 0) return null;
  const setParts = setKeys.map((k, i) => `"${k}" = $${i + 1}`);
  const { clause, params: whereParams } = _buildWhere(conditions, setKeys.length + 1);
  const text = `UPDATE "${table}" SET ${setParts.join(', ')} ${clause} RETURNING ${returning};`;
  const res = await query(text, [...setVals, ...whereParams]);
  return res.rows;
}

async function del(table, conditions = {}) {
  const { clause, params } = _buildWhere(conditions);
  const text = `DELETE FROM "${table}" ${clause} RETURNING *;`;
  const res = await query(text, params);
  return res.rows;
}

module.exports = {
  pool,
  query,
  findBy,
  findOne,
  insert,
  update,
  del,
};