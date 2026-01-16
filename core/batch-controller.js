/* core/batch-controller.js */

const consensus = require('./consensus');
const archiver = require('./stewardship/archiver');
const { pool } = require('./atlas-db');

class BatchController {
    constructor() {
        this.batchLimit = 5; // Reasonable limit per cycle
    }

    async processQueue() {
        console.log(`🚀 Artemis: Initializing Batch Mode (Limit: ${this.batchLimit})...`);

        // 1. Fetch pending URLs from the Atlas Folder/DB
        const res = await pool.query(
            "SELECT id, url FROM web_map WHERE status = 'pending' LIMIT $1", 
            [this.batchLimit]
        );

        if (res.rows.length === 0) {
            console.log("📭 Queue empty. All seeds nurtured.");
            return;
        }

        // 2. Process the batch in parallel
        const tasks = res.rows.map(row => this.processSingleSeed(row));
        await Promise.allSettled(tasks);

        console.log("✅ Batch Cycle Complete.");
    }

    async processSingleSeed(seed) {
        try {
            // A. Council Evaluation
            const result = await consensus.evaluateHarvest(seed);

            if (result.approved) {
                // B. Save to Stewardship (Optimization & Invention files)
                await archiver.archiveInPermanentRecord(seed, result);
                
                // C. Update Atlas Status
                await pool.query("UPDATE web_map SET status = 'archived' WHERE id = $1", [seed.id]);
            } else {
                console.log(`⚠️  Seed ${seed.url} rejected by Artemis (Low Nurture Score).`);
                await pool.query("UPDATE web_map SET status = 'rejected' WHERE id = $1", [seed.id]);
            }
        } catch (err) {
            console.error(`❌ Failure processing ${seed.url}:`, err.message);
        }
    }
}

module.exports = new BatchController();
