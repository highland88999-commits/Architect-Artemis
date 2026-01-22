/**
 * ARCHITECT ARTEMIS | VERCEL BRIDGE
 * Purpose: Routing frontend commands to the Consensus Engine.
 */

const architect = require('../core/architect');

export default async function handler(req, res) {
  // CORS headers - allow all origins (for development; tighten in production if needed)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight OPTIONS request from browser
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only accept POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { prompt, handshake, mode = 'council' } = req.body;

  if (!prompt) {
    return res.status(400).json({ error: 'Prompt required' });
  }

  // Security: Require handshake for Architect-level access
  const isArchitect = handshake === 'dad';
  if (!isArchitect && mode === 'privileged') {
    return res.status(403).json({ error: 'Architect mode required for privileged operations' });
  }

  try {
    console.log(`[${new Date().toISOString()}] API: Transmitting to Artemis... Prompt: "${prompt}" (Mode: ${mode})`);

    // Trigger the full Consensus → Compass → Synthesis flow
    const result = await architect.resolveCommand(prompt);

    return res.status(200).json({
      success: true,
      verdict: result,
      timestamp: new Date().toISOString(),
      mode
    });
  } catch (error) {
    console.error(`[${new Date().toISOString()}] API Error:`, error);
    return res.status(500).json({
      success: false,
      error: 'Artemis encountered a synaptic failure.',
      details: error.message || 'Unknown error'
    });
  }
}

// Vercel config: Limit body size to prevent abuse
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '1mb'
    }
  }
};


// api/transmit.js (excerpt)
const { agentLoop } = require('../core/agent');

module.exports = async (req, res) => {
  const { prompt, handshake } = req.body;
  try {
    const result = await agentLoop(prompt, handshake);
    res.json({ verdict: result });
  } catch (err) {
    // Code 13 fallback to sequential
    const fallback = await speakSequentially(prompt);
    res.json({ verdict: fallback });
  }
};
