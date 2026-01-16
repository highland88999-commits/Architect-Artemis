/* core/atlas-db.js */

const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

/**
 * Stewardship Logic: Fetches the next priority URL for Artemis to scan.
 * Aligns with the 'Organize' Directive.
 */
async function getNextWorkload() {
    const res = await pool.query(
        'SELECT * FROM internet_map WHERE status = $1 ORDER BY priority_rank DESC LIMIT 1',
        ['pending']
    );
    return res.rows[0];
}

module.exports = { pool, getNextWorkload };
