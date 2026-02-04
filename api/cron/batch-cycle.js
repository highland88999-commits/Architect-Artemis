/* api/cron/batch-cycle.js */
const controller = require('../../core/batch-controller');

export default async function handler(req, res) {
    if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
        return res.status(401).end();
    }
    try {
        await controller.processQueue();
        res.status(200).json({ status: "Batch Cycle Complete." });
    } catch (err) {
        res.status(500).json({ error: "Batch Cycle Failed." });
    }
}
