const { pool } = require('../core/atlas-db');
const { agentLoop } = require('../core/agent');

async function runHyperPulse() {
    console.log("🚀 Artemis Hyper-Pulse: Starting high-volume scan...");

    // 1. Fetch pending sites
    const { rows: queue } = await pool.query(
        "SELECT id, url FROM web_map WHERE status = 'pending' ORDER BY priority_score DESC LIMIT 100"
    );

    if (queue.length === 0) {
        console.log("📭 Queue empty. Artemis is resting.");
        process.exit(0);
    }

    console.log(`📡 Processing ${queue.length} sites in this pulse.`);

    for (const site of queue) {
        try {
            console.log(`🔍 Scanning: ${site.url}`);
            
            // Mark as scanning
            await pool.query("UPDATE web_map SET status = 'scanning' WHERE id = $1", [site.id]);

            // Run the Agent logic (The Nurture Scan)
            // We pass 'dad' because GitHub env has the secret handshake
            await agentLoop(`Analyze and optimize this domain: ${site.url}`, process.env.HANDSHAKE);

            // Mark as complete
            await pool.query("UPDATE web_map SET status = 'archived' WHERE id = $1", [site.id]);

            // Stay under Gemini 2 RPM (Request Per Minute) limit
            console.log("⏳ Throttling for 35s...");
            await new Promise(r => setTimeout(r, 35000)); 

        } catch (err) {
            console.error(`❌ Error scanning ${site.url}:`, err.message);
            await pool.query("UPDATE web_map SET status = 'error' WHERE id = $1", [site.id]);
        }
    }

    console.log("🏁 Pulse complete. Atlas memory updated.");
    await pool.end();
}

runHyperPulse();
