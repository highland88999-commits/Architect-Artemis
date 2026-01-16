/* api/stewardship-list.js */

const fs = require('fs');
const path = require('path');

export default async function handler(req, res) {
    // Security: Handshake check
    if (process.env.ARTEMIS_LANDLINE !== 'CONNECTED') {
        return res.status(503).json({ error: "Access Denied: Landline Offline" });
    }

    const stewardshipDir = path.join(process.cwd(), 'creator-creation/stewardship');
    const logFile = path.join(stewardshipDir, 'permanent_registry.json');

    try {
        if (!fs.existsSync(logFile)) {
            return res.status(200).json([]); // Return empty if no records exist yet
        }

        const data = fs.readFileSync(logFile, 'utf8');
        const registry = JSON.parse(data);

        // Sort by most recent for the Architect's view
        const sortedRegistry = registry.sort((a, b) => b.id - a.id);

        res.status(200).json(sortedRegistry);
    } catch (error) {
        res.status(500).json({ error: "Failed to retrieve the Permanent Record." });
    }
}
