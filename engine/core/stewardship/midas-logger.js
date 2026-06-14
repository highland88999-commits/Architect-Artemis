/* engine/core/stewardship/midas-logger.js */
const { pool } = require('../atlas-db');

class MidasLogger {
    /**
     * Records a Midas intervention into the Permanent Record (Supabase).
     */
    async logIntervention(data) {
        console.log("📖 Midas Logger: Securing Golden Guidance in Supabase...");

        const timestamp = new Date().toLocaleString();
        
        // Create the visual Markdown 'Tome' for the Architect
        const markdownTome = `
# ✨ MIDAS GOLDEN GUIDANCE
**Date:** ${timestamp}
**Status:** SYSTEM_SAVED

## The Confusion
> ${data.context}
**Error:** ${data.error}

## The Golden Path
${data.guidance}

**Rerouted To:** ${data.new_target}
        `.trim();

        try {
            await pool.query(
                "INSERT INTO stewardship_logs (task, thought) VALUES ($1, $2)",
                [`Midas Intervention: ${data.context.substring(0, 50)}...`, markdownTome]
            );
            console.log("✅ Midas Tome permanently secured.");
        } catch (err) {
            console.error("❌ Failed to log Midas intervention to DB:", err.message);
        }
    }
}

module.exports = new MidasLogger();


