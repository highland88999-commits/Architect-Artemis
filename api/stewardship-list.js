/**
 * STEWARDSHIP REGISTRY ENDPOINT
 * Returns the permanent stewardship log / registry for Architect view.
 * Now wired directly to Supabase via Postgres Pool.
 */

// Import the database pool from the engine
const { pool } = require('../engine/core/atlas-db');

const LANDLINE_KEY = process.env.ARTEMIS_LANDLINE;

function log(level, message, meta = {}) {
  console[level === 'error' ? 'error' : level === 'warn' ? 'warn' : 'log'](`[Stewardship-List] ${message}`, meta);
}

module.exports = async function handler(req, res) {
  // CORS Preflight
  if (req.method === 'OPTIONS') return res.status(200).end();

  // ─── Security & method check ───
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed', allowed: ['GET'] });
  }

  if (LANDLINE_KEY !== 'CONNECTED') {
    log('warn', 'Landline disconnected – access denied');
    return res.status(503).json({ error: 'Access Denied', message: 'Artemis Landline is not CONNECTED.' });
  }

  // ─── Optional query params ───
  const { limit = 100, sort = 'desc' } = req.query;
  const maxLimit = Math.min(parseInt(limit, 10) || 100, 500); 
  const orderDirection = sort === 'asc' ? 'ASC' : 'DESC';

  try {
    // VERCEL/SUPABASE UPGRADE: Fetch directly from the DB
    const result = await pool.query(
      `SELECT id, task, thought, created_at as timestamp 
       FROM stewardship_logs 
       ORDER BY created_at ${orderDirection} 
       LIMIT $1`,
      [maxLimit]
    );

    res.setHeader('Cache-Control', 'no-store, max-age=0'); 
    res.setHeader('Content-Type', 'application/json');

    log('info', 'Stewardship registry served from Supabase', {
      returnedRecords: result.rows.length
    });

    return res.status(200).json(result.rows);

  } catch (err) {
    log('error', 'Stewardship list DB query failed', { error: err.message });
    return res.status(500).json({
      error: 'Failed to retrieve Permanent Registry',
      message: 'Database connection error. Ensure Supabase is awake.',
    });
  }
};

