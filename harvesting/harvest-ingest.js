// harvesting/harvest-ingest.js (or append to recursive-harvest.js)
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

/**
 * Ingest harvested page objects into PostgreSQL harvests table
 * @param {Array} pages - array of pageData objects from recursiveHarvest
 * @param {number} jobId - optional parent job ID from workload queue
 */
async function ingestHarvestToDb(pages, jobId = null) {
  if (!pages?.length) return 0;

  const client = await pool.connect();
  let inserted = 0;

  try {
    await client.query('BEGIN');

    for (const page of pages) {
      const {
        url,
        title,
        description,
        emails,
        flaws,
        inspiration,
        timestamp,
        depth,
      } = page;

      await client.query(
        `INSERT INTO harvests (
          url, title, description, emails, flaws, inspiration,
          harvest_timestamp, depth, job_id, status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'complete')
        ON CONFLICT (url) DO UPDATE SET
          title = EXCLUDED.title,
          description = EXCLUDED.description,
          emails = EXCLUDED.emails,
          flaws = EXCLUDED.flaws,
          inspiration = EXCLUDED.inspiration,
          harvest_timestamp = EXCLUDED.harvest_timestamp,
          depth = EXCLUDED.depth`,
        [
          url,
          title,
          description,
          emails,
          flaws,
          inspiration,
          timestamp,
          depth,
          jobId,
        ]
      );
      inserted++;
    }

    await client.query('COMMIT');
    console.log(`[Ingest] Successfully saved ${inserted} pages`);
    return inserted;
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('[Ingest] Failed:', err.message);
    throw err;
  } finally {
    client.release();
  }
}

module.exports = { ingestHarvestToDb };
