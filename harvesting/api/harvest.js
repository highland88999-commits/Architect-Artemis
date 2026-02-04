// api/harvest.js
// Vercel Serverless Function – Harvest endpoint

import { Pool } from 'pg';
import { attachDatabasePool } from '@vercel/functions'; // Vercel magic for pooling + suspension cleanup
import Loom from '../harvesting/loom'; // Adjust path if needed

// ────────────────────────────────────────────────
// Global pool (created once per module lifetime)
// This is the recommended pattern for Vercel Fluid compute
// ────────────────────────────────────────────────
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // Recommended tuning for serverless (adjust based on your DB limits)
  max: 10,                    // Max connections in pool
  idleTimeoutMillis: 5000,    // Close idle after 5s (prevents leaks)
  connectionTimeoutMillis: 5000, // Fail fast on bad connects
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

// Attach Vercel handler (prevents suspension leaks)
attachDatabasePool(pool);

export default async function handler(req, res) {
  // ────────────────────────────────────────────────
  // Security & early exits
  // ────────────────────────────────────────────────
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  if (process.env.ARTEMIS_LANDLINE !== 'CONNECTED') {
    return res.status(503).json({ error: 'Artemis Landline Disconnected.' });
  }

  const { seedUrl } = req.body;

  if (!seedUrl || typeof seedUrl !== 'string' || !seedUrl.startsWith('http')) {
    return res.status(400).json({ error: 'Invalid or missing seedUrl (must be valid HTTP/HTTPS URL)' });
  }

  // Optional: basic SSRF protection (expand as needed)
  try {
    const url = new URL(seedUrl);
    if (!['http:', 'https:'].includes(url.protocol)) {
      return res.status(400).json({ error: 'Invalid protocol' });
    }
  } catch {
    return res.status(400).json({ error: 'Malformed URL' });
  }

  let client;
  try {
    // ────────────────────────────────────────────────
    // Acquire connection from pool (fast reuse if available)
    // ────────────────────────────────────────────────
    client = await pool.connect();

    const loom = new Loom(client);

    // Optional: add timeout wrapper around loom.sow (prevent hanging functions)
    const harvestPromise = loom.sow(seedUrl);
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Harvest timeout')), 30000) // 30s max
    );

    await Promise.race([harvestPromise, timeoutPromise]);

    // Success
    res.status(200).json({
      status: 'Success',
      message: `Artemis has harvested new seeds from ${seedUrl}. The Atlas is updating.`,
    });
  } catch (error) {
    console.error('[harvest.js] Error:', {
      message: error.message,
      stack: error.stack?.slice(0, 300), // truncate for logs
      seedUrl,
    });

    const status = error.message.includes('timeout') ? 504 : 500;
    res.status(status).json({
      error: status === 504 ? 'Harvest timeout – try again later' : 'Internal harvest error',
    });
  } finally {
    // ALWAYS release back to pool (critical!)
    if (client) {
      client.release().catch((e) => console.error('Release error:', e));
    }
  }
}
