// /api/cron.js
import ConsensusEngine from '../engine/core/stewardship/consensus.js';
import MidasLogger from '../engine/core/stewardship/midas-logger.js';

export default async function handler(req, res) {
    // 1. Security: Ensure only Vercel's Cron can trigger this endpoint
    if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
        return res.status(401).json({ error: 'Unauthorized. Artemis security protocols active.' });
    }

    console.log("⚡ [CRON START] Artemis Heartbeat Initialized...");

    try {
        // 2. Wake up the Engine: Fetch a target URL from your database queue
        // (For example purposes, we pass a dummy/target URL)
        const targetUrlData = { url: "https://example-target.com" }; 

        // 3. Execute the Heavy Analysis
        const result = await ConsensusEngine.evaluateHarvest(targetUrlData);

        console.log(`✅ [CRON SUCCESS] Target evaluated. Score: ${result.nurture_score}`);
        
        return res.status(200).json({ 
            status: 'success', 
            message: 'Artemis heartbeat complete.',
            target: targetUrlData.url,
            score: result.nurture_score
        });

    } catch (error) {
        console.error("❌ [CRON ERROR] Heartbeat failed:", error.message);
        return res.status(500).json({ error: error.message });
    }
}


