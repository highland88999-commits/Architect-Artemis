/* core/atlas-db.js */
const { Pool } = require('pg');
require('dotenv').config();

// Initialize the Connection Pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // SSL is required for most hosted PostgreSQL instances (Neon, Supabase, Render)
  ssl: {
    rejectUnauthorized: false
  }
});

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

// Export the pool and the custom logic
module.exports = { 
    pool, 
    getNextWorkload,
    query: (text, params) => pool.query(text, params) // Helper for direct queries
};
