/* api/midas-guidance.js */

const Midas = require('../core/midas-guide');

export default async function handler(req, res) {
    // Security: Handshake check
    if (process.env.ARTEMIS_LANDLINE !== 'CONNECTED') {
        return res.status(503).json({ error: "Access Denied" });
    }

    try {
        const { context, errorLog } = req.body;

        // Midas analyzes the failure or confusion
        const goldenPath = await Midas.provideGuidance(context, errorLog);

        res.status(200).json({
            agent: "MIDAS",
            message: "The Golden Path has been revealed.",
            guidance: goldenPath.guidance,
            action: goldenPath.action,
            style: "GOLDEN_OVERLAY"
        });
    } catch (err) {
        res.status(500).json({ error: "Midas Touch Failed: Synaptic Break." });
    }
}
