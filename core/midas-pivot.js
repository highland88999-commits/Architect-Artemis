/* core/midas-pivot.js */

const { pool } = require('./atlas-db');

class MidasPivot {
    /**
     * The Golden Pivot: Force-updates the queue based on Midas' insight.
     */
    async executePivot(oldUrlId, newUrlReasoning) {
        console.log("✨ Midas: Transmuting a dead-end into a Golden Path...");

        // 1. Mark the failing URL as 'dead-end'
        await pool.query(
            'UPDATE web_map SET status = $1 WHERE id = $2',
            ['dead-end', oldUrlId]
        );

        // 2. Find a 'Golden' alternative (e.g., a sibling link or root domain)
        const result = await pool.query(
            `UPDATE web_map 
             SET priority_score = 10, status = 'queued' 
             WHERE status = 'pending' 
             AND source_origin = (SELECT source_origin FROM web_map WHERE id = $1)
             LIMIT 1 RETURNING url`,
            [oldUrlId]
        );

        return result.rows[0] ? result.rows[0].url : null;
    }
}

module.exports = new MidasPivot();
