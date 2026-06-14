/* engine/core/metabolism.js */
const fs = require('fs-extra');
const path = require('path');
const { pool } = require('./atlas-db'); // Wired to Supabase

/**
 * ARCHITECT ARTEMIS | METABOLISM
 * Purpose: 30-Day Mortal Recall & Data Recycling.
 * Ensures the system remains clean, fast, and free of data-bloat.
 */
class Metabolism {
    constructor() {
        // Vercel only allows writing/deleting in the /tmp/ directory
        this.voidPath = '/tmp/';
    }

    /**
     * Mortal Recall (Database Pruning)
     * Forgets old, rejected, or broken seeds older than 30 days so her mind stays uncluttered.
     */
    async runMortalRecall() {
        console.log("♻️ Artemis: Initiating Mortal Recall (30-Day Prune)...");
        try {
            // Delete URLs that were rejected or errored out more than 30 days ago
            const result = await pool.query(`
                DELETE FROM web_map 
                WHERE status IN ('rejected', 'error') 
                AND created_at < NOW() - INTERVAL '30 days'
            `);
            
            console.log(`✅ Mortal Recall complete. Erased ${result.rowCount} dead seeds from memory.`);
        } catch (error) {
            console.error("❌ Metabolic Error during Recall:", error.message);
        }
    }

    /**
     * Systemic Purge (Vercel Container Cleanup)
     * Empties the /tmp/ folder of temporary diagnostic scraps and incubator files.
     */
    async purgeVoid() {
        console.log("🧹 Artemis: Emptying the Void (Container Cleanup)...");
        try {
            const files = await fs.readdir(this.voidPath);
            
            for (const file of files) {
                // Don't delete system critical files that Vercel might use, just our scraps
                if (file.endsWith('.md') || file.endsWith('.json') || file.startsWith('CONFLICT') || file.startsWith('RISK')) {
                    await fs.remove(path.join(this.voidPath, file));
                }
            }
            console.log("✅ Void purged. Temporary container space restored.");
        } catch (error) {
            console.error("❌ Metabolic Error during Purge:", error.message);
        }
    }

    /**
     * Daily Health Sync
     * A simple DB ping to ensure her Atlas is still responding optimally.
     */
    async syncAtlas() {
        console.log("🗺️ Artemis: Syncing Atlas data...");
        try {
            await pool.query('SELECT 1');
            console.log("✅ Atlas heartbeat normal.");
        } catch (err) {
            console.error("❌ Atlas Sync Failed. Database may be sleeping.", err.message);
        }
    }
}

module.exports = new Metabolism();


