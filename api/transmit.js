require('dotenv').config();
const { agentLoop } = require('../core/agent');

export default async function handler(req, res) {
  // ─── CORS ───
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  // ─── Input Parsing ───
  let body;
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  } catch (e) {
    return res.status(400).json({ error: 'Invalid JSON body' });
  }

  const { prompt, handshake = 'stranger' } = body;

  // ─── Landline Check ───
  if (process.env.ARTEMIS_LANDLINE !== 'CONNECTED') {
    return res.status(503).json({ error: 'Offline', message: 'Artemis Landline is DISCONNECTED.' });
  }

  try {
    const result = await agentLoop(prompt, handshake);
    
    // Ensure we always return an object with 'verdict' and 'files'
    const payload = typeof result === 'object' 
      ? { verdict: result.verdict, files: result.files || [] }
      : { verdict: result, files: [] };

    return res.status(200).json({
      success: true,
      ...payload,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    console.error('Transmit Error:', err);
    return res.status(500).json({ error: 'Synaptic failure in bridge.' });
  }
}
