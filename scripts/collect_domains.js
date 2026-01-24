const { Pool } = require('pg');
const axios = require('axios');

// Database configuration via environment variable
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

/**
 * Harvests newly registered domains and inserts them into the PostgreSQL 'web_map' table.
 * This replaces the local queue.json to ensure the Batch Controller and 
 * Neural Heartbeat are synchronized.
 */
async function fetchAndSeedDomains() {
  // Using an alias for the internal harvester name
  console.log('🌱 Project Atlas: Harvesting new seeds for the database...');

  let newDomainsCount = 0;
  const sourceUrl = 'https://raw.githubusercontent.com/shreshta-labs/newly-registered-domains/main/nrd-1w.txt';

  try {
    const response = await axios.get(sourceUrl, { timeout: 15000 });
    const lines = response.data.split('\n').map(d => d.trim()).filter(Boolean);
    
    // Limit per heartbeat to manage database load
    const fetched = lines.slice(0, 200); 

    for (const url of fetched) {
      try {
        // ON CONFLICT ensures we don't duplicate domains already in the Atlas
        const res = await pool.query(
          `INSERT INTO web_map (url, status, priority_score) 
           VALUES ($1, 'pending', 5) 
           ON CONFLICT (url) DO NOTHING`, 
          [url]
        );

        if (res.rowCount > 0) {
          newDomainsCount++;
        }
      } catch (err) {
        console.error(`Failed to insert ${url}:`, err.message);
      }
    }

    console.log(`✅ Success: ${newDomainsCount} new domains added to the queue.`);
  } catch (err) {
    console.error('Failed to fetch from shreshta-labs:', err.message);
  } finally {
    // Close the pool connection
    await pool.end();
  }
}

(async () => {
  try {
    await fetchAndSeedDomains();
    process.exit(0);
  } catch (err) {
    console.error('Domain collection critical failure:', err);
    process.exit(1);
  }
})();
