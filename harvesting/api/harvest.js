/* api/harvest.js */

const Loom = require('../harvesting/loom');
const { Client } = require('pg'); // Assuming PostgreSQL for the Master DB

export default async function handler(req, res) {
    // Security: Only allow if the landline is connected
    if (process.env.ARTEMIS_LANDLINE !== 'CONNECTED') {
        return res.status(503).json({ error: "Artemis Landline Disconnected." });
    }

    const client = new Client({ connectionString: process.env.DATABASE_URL });
    await client.connect();

    const loom = new Loom(client);
    const { seedUrl } = req.body;

    try {
        // Step 1: Sow the seeds (Harvest URLs)
        await loom.sow(seedUrl);
        
        // Step 2: Inform the Architect of success
        res.status(200).json({ 
            status: "Success", 
            message: `Artemis has harvested new seeds from ${seedUrl}. The Atlas is updating.` 
        });
    } catch (error) {
        res.status(500).json({ error: "Synaptic Timeout in Loom Engine." });
    } finally {
        await client.end();
    }
}
