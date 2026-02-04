// harvesting/harvest-supervisor.js
/**
 * Artemis Harvest Supervisor
 * Continuously polls for queued jobs → runs recursive harvest → ingests results
 * Run: node harvest-supervisor.js
 */

require('dotenv').config();
const axios = require('axios');
const { recursiveHarvest } = require('./recursive-harvest');
const path = require('path');
const fs = require('fs-extra');

const POLL_INTERVAL_MS = 15000;     // 15 seconds
const MAX_CONCURRENT = 3;           // adjust based on resources
const COUNCIL_ENDPOINT = process.env.COUNCIL_ENDPOINT || 'http://localhost:3000/api/transmit';

let activeWorkers = 0;

async function pollAndHarvest() {
  if (activeWorkers >= MAX_CONCURRENT) {
    console.log(`[Supervisor] Max workers reached (${activeWorkers}/${MAX_CONCURRENT}). Waiting...`);
    return;
  }

  activeWorkers++;

  try {
    // Poll next job (assume you expose a tiny endpoint in workload_manager or FastAPI wrapper)
    const res = await axios.post('http://localhost:8000/next-job'); // ← replace with real endpoint
    const job = res.data;

    if (!job || !job.url) {
      console.log('[Supervisor] Queue empty.');
      activeWorkers--;
      return;
    }

    console.log(`[Supervisor] Processing job ${job.id}: ${job.url}`);

    // Run harvest
    const harvestResult = await recursiveHarvest(job.url);

    // Ingest results to DB (step 2 below)
    await ingestHarvestToDb(harvestResult.harvested, job.id);

    // Mark complete
    await axios.post('http://localhost:8000/complete-job', {
      jobId: job.id,
      harvestedCount: harvestResult.stats.pages,
    });

    console.log(`[Supervisor] Job ${job.id} complete – ${harvestResult.stats.pages} pages`);
  } catch (err) {
    console.error('[Supervisor] Error in worker:', err.message);
    // Optional: mark failed via API
    try {
      await axios.post('http://localhost:8000/failed-job', {
        jobId: job?.id,
        error: err.message,
      });
    } catch {}
  } finally {
    activeWorkers--;
  }
}

// Simple file → DB ingestion helper (expand later)
async function ingestHarvestToDb(pages, jobId) {
  // Placeholder – implement with pg client
  console.log(`[Ingest] Would save ${pages.length} pages for job ${jobId}`);
  // Example: for each page → insert into harvests table
  // await db.query('INSERT INTO harvests ...', [...])
}

console.log('[Supervisor] Starting harvest loop...');
setInterval(pollAndHarvest, POLL_INTERVAL_MS);
pollAndHarvest(); // initial run
