/* api/get-latest-midas-guidance.js */
const { pool } = require('../engine/core/atlas-db');

export default async function handler(req, res) {
    try {
        const result = await pool.query("SELECT latest_guidance FROM midas_status WHERE id = 1");
        if (result.rows.length > 0) {
            res.status(200).json({ guidance: result.rows[0].latest_guidance });
        } else {
            res.status(200).json({ guidance: "Calculating optimized path..." });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

