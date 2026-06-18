/* api/check-midas-status.js */
const { pool } = require('../engine/core/atlas-db');

export default async function handler(req, res) {
    try {
        const result = await pool.query("SELECT trigger_intervention, lost_id, target_id FROM midas_status WHERE id = 1");
        if (result.rows.length > 0) {
            res.status(200).json(result.rows[0]);
        } else {
            res.status(200).json({ trigger_intervention: false });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}


