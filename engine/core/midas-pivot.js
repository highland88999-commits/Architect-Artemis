/* engine/core/midas-pivot.js */
const { pool } = require('./atlas-db');

class MidasPivot {
    /**
     * The Golden Pivot: Force-updates the queue based on Midas' insight.
     * Abandons a dead link and finds a better path on the same domain.
     */
    async executePivot(oldUrlId) {
        console.log("✨ Midas: Transmuting a dead-end into a Golden Path...");

        try {
            // 1. Fetch the URL that is failing so we know its domain
            const urlRes = await pool.query('SELECT url FROM web_map WHERE id = $1', [oldUrlId]);
            if (urlRes.rows.length === 0) return null;
            
            const failingUrl = urlRes.rows[0].url;
            
            // Extract the base domain (e.g., https://example.com)
            const urlObj = new URL(failingUrl);
            const baseDomain = `${urlObj.protocol}//${urlObj.hostname}%`;

            // 2. Mark the failing URL as 'error' (our equivalent of dead-end)
            await pool.query(
                "UPDATE web_map SET status = 'error' WHERE id = $1",
                [oldUrlId]
            );

            // 3. Find a 'Golden' alternative (a sibling link on the same domain)
            // Boosts its priority_rank to 10 so the Batch Controller picks it up next
            const result = await pool.query(
                `UPDATE web_map 
                 SET priority_rank = 10 
                 WHERE id = (
                    SELECT id FROM web_map 
                    WHERE status = 'pending' 
                    AND url LIKE $1 
                    AND id != $2
                    ORDER BY priority_rank DESC 
                    LIMIT 1
                 )
                 RETURNING url`,
                [baseDomain, oldUrlId]
            );

            if (result.rows[0]) {
                console.log(`🌟 Golden Path Found: Redirecting focus to ${result.rows[0].url}`);
                return result.rows[0].url;
            } else {
                console.log("⚠️ No Golden Path found on this domain. Moving to next seed.");
                return null;
            }

        } catch (error) {
            console.error("❌ Midas Pivot Error:", error.message);
            return null;
        }
    }
}

module.exports = new MidasPivot();


