// 1. Import all your existing logic from their new hiding spot
const wakeEngine = require('../engine/endpoints/wake-engine');
const dailySummary = require('../engine/endpoints/daily-summary');
const metabolismPulse = require('../engine/endpoints/metabolism-pulse');
const unifiedPulse = require('../engine/endpoints/unified-pulse');
const checkMidas = require('../engine/endpoints/check-midas-status');
const getLatestMidas = require('../engine/endpoints/get-latest-midas-guidance');
const batchCycle = require('../engine/endpoints/batch-cycle');

module.exports = async (req, res) => {
    // 2. Look at the URL the frontend asked for
    const url = req.url;

    // 3. Route the traffic to the correct hidden file!
    try {
        if (url.includes('wake-engine')) return wakeEngine(req, res);
        if (url.includes('daily-summary')) return dailySummary(req, res);
        if (url.includes('metabolism-pulse')) return metabolismPulse(req, res);
        if (url.includes('unified-pulse')) return unifiedPulse(req, res);
        if (url.includes('check-midas-status')) return checkMidas(req, res);
        if (url.includes('get-latest-midas-guidance')) return getLatestMidas(req, res);
        if (url.includes('batch-cycle')) return batchCycle(req, res);

        // If nothing matches
        return res.status(404).json({ error: "Artemis Matrix Endpoint Not Found" });
    } catch (error) {
        console.error("Gateway Error:", error);
        return res.status(500).json({ error: "Gateway failure" });
    }
};


