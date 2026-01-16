/**
 * ARCHITECT ARTEMIS | VERCEL BRIDGE
 * Purpose: Routing frontend commands to the Consensus Engine.
 */

const architect = require('../core/architect');

export default async function handler(req, res) {
    // Only allow POST requests for security
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { prompt, handshake } = req.body;

    // Secondary security check for the API route
    if (handshake !== 'dad') {
        return res.status(403).json({ error: 'Identity unverified.' });
    }

    try {
        console.log("📡 API: Transmitting to Artemis...");
        
        // This triggers the full Consensus -> Compass -> Synthesis flow
        const result = await architect.resolveCommand(prompt);

        return res.status(200).json({ 
            success: true, 
            verdict: result 
        });
    } catch (error) {
        console.error("API Error:", error);
        return res.status(500).json({ error: "Artemis encountered a synaptic failure." });
    }
}
