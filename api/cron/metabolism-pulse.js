/* api/cron/metabolism-pulse.js */
const Metabolism = require('../../core/metabolism');
const brain = new Metabolism();

export default async function handler(req, res) {
    if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
        return res.status(401).end();
    }
    try {
        await brain.runMortalRecall();
        await brain.purgeVoid();
        res.status(200).json({ status: "Metabolism Synced: System Cleaned." });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}
