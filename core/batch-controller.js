const consensus = require('./consensus');
const archiver = require('./stewardship/archiver');
const mailer = require('./stewardship/mail-engine');
const { pool } = require('./atlas-db');

class BatchController {
    constructor() {
        this.batchLimit = 5; // Reasonable limit per cycle
    }

    async processQueue() {
        // Alias update for Artemis privacy
        console.log(`🚀 Atlas: Initializing Batch Mode (Limit: ${this.batchLimit})...`);

        // 1. Fetch pending URLs from the Atlas DB
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
                // B. Save to Stewardship (Permanent Record)
                await archiver.archiveInPermanentRecord(seed, result);
                
                // C. Auto-outreach for high-value seeds
                // Checks for high nurture score and presence of valid contact data
                if (result.nurture_score >= 8 && result.contact_info && result.contact_info !== "No direct contact data harvested.") {
                    console.log(`📧 Atlas: High Nurture Score (${result.nurture_score}) detected. Initiating outreach for ${seed.url}`);
                    await mailer.sendNurtureReport(result, result.contact_info);
                }

                // D. Update Atlas Status
                await pool.query("UPDATE web_map SET status = 'archived' WHERE id = $1", [seed.id]);
                console.log(`✨ Seed ${seed.url} successfully nurtured and archived.`);
                
            } else {
                console.log(`⚠️  Seed ${seed.url} rejected (Low Nurture Score).`);
                await pool.query("UPDATE web_map SET status = 'rejected' WHERE id = $1", [seed.id]);
            }
        } catch (err) {
            console.error(`❌ Failure processing ${seed.url}:`, err.message);
        }
    }
}

module.exports = new BatchController();
