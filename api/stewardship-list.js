// api/stewardship-list.js
/**
 * STEWARDSHIP REGISTRY ENDPOINT
 * Returns the permanent stewardship log / registry for Architect view.
 * File-based persistence in creator-creation/stewardship/permanent_registry.json
 */

require('dotenv').config();
const fs = require('fs').promises;
const path = require('path');

const LANDLINE_KEY = process.env.ARTEMIS_LANDLINE;
const STEWARDSHIP_DIR = path.resolve(process.cwd(), 'creator-creation/stewardship');
const REGISTRY_FILE = path.join(STEWARDSHIP_DIR, 'permanent_registry.json');

// ────────────────────────────────────────────────
// Structured logging helper
// ────────────────────────────────────────────────
function log(level, message, meta = {}) {
  const entry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...meta,
  };
  console[level === 'error' ? 'error' : level === 'warn' ? 'warn' : 'log'](
    `[Stewardship-List] ${message}`,
    meta
  );
  // Future: append to file or send to observability tool
}

export default async function handler(req, res) {
  // ─── Security & method check ───
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed', allowed: ['GET'] });
  }

  if (LANDLINE_KEY !== 'CONNECTED') {
    log('warn', 'Landline disconnected – access denied');
    return res.status(503).json({
      error: 'Access Denied',
      message: 'Artemis Landline is not CONNECTED. Check environment variables.',
    });
  }

  // ─── Optional query params ───
  const { limit = 100, sort = 'desc' } = req.query;
  const maxLimit = Math.min(parseInt(limit, 10) || 100, 500); // safety cap
  const isDesc = sort !== 'asc';

  try {
    // Ensure directory exists (defensive)
    await fs.mkdir(STEWARDSHIP_DIR, { recursive: true });

    let registry = [];

    try {
      const data = await fs.readFile(REGISTRY_FILE, 'utf8');
      registry = JSON.parse(data);

      // Defensive: ensure it's an array
      if (!Array.isArray(registry)) {
        log('warn', 'Registry file corrupted – not an array', { file: REGISTRY_FILE });
        registry = [];
      }
    } catch (err) {
      if (err.code === 'ENOENT') {
        log('info', 'Registry file not found yet – returning empty list');
        // Return empty array – normal first-run state
      } else {
        log('error', 'Failed to read registry file', {
          error: err.message,
          code: err.code,
          path: REGISTRY_FILE,
        });
        throw err;
      }
    }

    // ─── Sort safely ───
    const sorted = [...registry].sort((a, b) => {
      const aTime = a?.timestamp ? new Date(a.timestamp).getTime() : 0;
      const bTime = b?.timestamp ? new Date(b.timestamp).getTime() : 0;
      return isDesc ? bTime - aTime : aTime - bTime;
    });

    // ─── Apply limit ───
    const result = sorted.slice(0, maxLimit);

    // ─── Response headers ───
    res.setHeader('Cache-Control', 'no-store, max-age=0'); // no caching sensitive logs
    res.setHeader('Content-Type', 'application/json');

    log('info', 'Stewardship registry served', {
      totalRecords: registry.length,
      returned: result.length,
      sort: isDesc ? 'desc' : 'asc',
    });

    return res.status(200).json(result);

  } catch (err) {
    log('error', 'Stewardship list endpoint failed', {
      error: err.message,
      stack: err.stack?.slice(0, 300),
    });

    return res.status(500).json({
      error: 'Failed to retrieve Permanent Registry',
      message: 'Internal server error – check server logs.',
    });
  }
}
