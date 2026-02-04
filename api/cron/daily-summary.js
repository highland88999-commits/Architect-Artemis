/* api/cron/daily-summary.js */

const summary = require('../../core/stewardship/health-summary');

export default async function handler(req, res) {
    // Ensure only authorized CRON can trigger
    if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
        return res.status(401).end();
    }

    try {
        const report = await summary.generateDailyReport();
        res.status(200).json({ message: "Daily Health Report Generated.", report });
    } catch (err) {
        res.status(500).json({ error: "Health Summary Failed." });
    }
}
