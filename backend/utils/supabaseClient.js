// filepath: backend/utils/supabaseClient.js
const { createClient } = require('@supabase/supabase-js');
const { Pool } = require('pg');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!supabaseUrl || !supabaseKey) {
  throw new Error('Supabase URL and Service Role Key are required.');
}
const supabase = createClient(supabaseUrl, supabaseKey);

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is required in environment (.env).');
}

// Accept self-signed SSL from some hosted Postgres (Render/Heroku). Set to false if not needed.
const useSSL = process.env.PGSSLMODE !== 'disable' && (process.env.NODE_ENV === 'production' || process.env.PGSSLMODE === 'require');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: useSSL ? { rejectUnauthorized: false } : false,
});

// Basic helper utilities to replace common Supabase patterns
async function query(text, params = []) {
  const res = await pool.query(text, params);
  return res;
}

function _buildWhere(conditions = {}, startIndex = 1) {
  const keys = Object.keys(conditions);
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
  const keys = Object.keys(data);
  const vals = Object.values(data);
  const cols = keys.map(k => `"${k}"`).join(', ');
  const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');
  const text = `INSERT INTO "${table}" (${cols}) VALUES (${placeholders}) RETURNING ${returning};`;
  const res = await query(text, vals);
  return res.rows[0];
}

async function update(table, conditions = {}, data = {}, returning = '*') {
  const setKeys = Object.keys(data);
  const setVals = Object.values(data);
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