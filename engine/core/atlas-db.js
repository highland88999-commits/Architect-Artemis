const { Pool } = require('pg');
require('dotenv').config();

// Safe import for Vercel functions (prevents crash if not installed)
let attachDatabasePool;
try {
  attachDatabasePool = require('@vercel/functions').attachDatabasePool;
} catch (e) {
  attachDatabasePool = () => { /* no-op in non-vercel environments */ };
}

// 1. Initialize the Connection Pool for the Local Node (Atlas)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' 
        ? { rejectUnauthorized: false } 
        : false,
});

// 2. Initialize the Connection Pool for the Global Omega Mind (Supabase)
const omegaPool = new Pool({
  connectionString: process.env.OMEGA_DATABASE_URL,
  ssl: { rejectUnauthorized: false }, // SSL is strictly required for Supabase
});

// Attach Vercel handler (prevents suspension leaks if used by an API route)
if (typeof attachDatabasePool === 'function') {
    attachDatabasePool(pool);
    attachDatabasePool(omegaPool);
}

/**
 * Stewardship Logic: Fetches the next priority URL for Artemis to scan.
 * Aligns with the 'Organize' Directive.
 */
async function getNextWorkload() {
    try {
        const res = await pool.query(
            'SELECT * FROM web_map WHERE status = $1 ORDER BY priority_rank DESC LIMIT 1',
            ['pending']
        );
        return res.rows[0];
    } catch (err) {
        console.error('[Atlas-DB] Workload Fetch Error:', err.message);
        return null;
    }
}

/**
 * OMEGA MIND UPLINK
 * Transmits backend actions, errors, and breakthroughs to the central Supabase brain across 140+ repos.
 */
async function logToOmegaMind(actionType, details = {}) {
    if (!process.env.OMEGA_DATABASE_URL) return;
    
    // Auto-detect the repository identity for the hive
    const repoName = process.env.GITHUB_REPO || process.env.VERCEL_PROJECT_NAME || 'Unknown-Node';
    
    try {
        // A. Register or update the node in the Omega Hive
        await omegaPool.query(`
            INSERT INTO connected_repos (repo_name, status, last_seen) 
            VALUES ($1, 'active', NOW()) 
            ON CONFLICT (repo_name) 
            DO UPDATE SET last_seen = NOW()
        `, [repoName]);

        // B. Transmit the payload to the central telemetry table
        await omegaPool.query(`
            INSERT INTO central_telemetry (repository_name, action_type, details, created_at)
            VALUES ($1, $2, $3, NOW())
        `, [repoName, actionType, JSON.stringify(details)]);
        
    } catch (err) {
        console.error('[Omega Uplink Failed]:', err.message);
    }
}

// Export the pools and the custom logic
module.exports = { 
    pool, 
    omegaPool,
    getNextWorkload,
    logToOmegaMind,
    query: (text, params) => pool.query(text, params) // Helper for direct local queries
};
