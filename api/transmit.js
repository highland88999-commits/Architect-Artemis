// api/transmit.js
/**
 * ARCHITECT ARTEMIS – VERCEL API BRIDGE
 * Main entry point: routes frontend prompts → Consensus Engine / Agent Loop
 * Supports council mode (public) and privileged Architect mode (handshake required)
 */

require('dotenv').config();
const { agentLoop } = require('../core/agent');
const { speakSequentially } = require('../core/consensus'); // fallback

const LANDLINE_KEY = process.env.ARTEMIS_LANDLINE || 'DISCONNECTED';
const MAX_PROMPT_LENGTH = 8000; // safety cap

// ────────────────────────────────────────────────
// Structured logging helper
// ────────────────────────────────────────────────
function log(level, message, meta = {}) {
  const entry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...meta,
  };
  console[level === 'error' ? 'error' : level === 'warn' ? 'warn' : 'log'](
    `[Transmit API] ${message}`,
    meta
  );
  // Future: send to Sentry, Loki, or file
}

export default async function handler(req, res) {
  // ─── CORS & preflight ───
  res.setHeader('Access-Control-Allow-Origin', '*'); // tighten in prod (e.g. your domain)
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed', allowed: ['POST'] });
  }

  // ─── Body parsing & validation ───
  let body;
  try {
    body = await req.json();
  } catch {
    log('warn', 'Invalid JSON body');
    return res.status(400).json({ error: 'Invalid JSON payload' });
  }

  const { prompt, handshake, mode = 'council' } = body;

  if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
    log('warn', 'Missing or empty prompt');
    return res.status(400).json({ error: 'Valid "prompt" string is required' });
  }

  if (prompt.length > MAX_PROMPT_LENGTH) {
    log('warn', 'Prompt too long', { length: prompt.length });
    return res.status(413).json({ error: `Prompt exceeds ${MAX_PROMPT_LENGTH} characters` });
  }

  // ─── Access control ───
  const isArchitect = handshake === 'dad';
  const requiresArchitect = mode === 'privileged' || mode === 'architect';

  if (requiresArchitect && !isArchitect) {
    log('warn', 'Privileged mode attempted without Architect handshake', { mode });
    return res.status(403).json({
      error: 'Access Denied',
      message: 'Architect mode requires valid handshake.',
    });
  }

  if (LANDLINE_KEY !== 'CONNECTED') {
    log('warn', 'Landline disconnected – denying request');
    return res.status(503).json({
      error: 'Service Unavailable',
      message: 'Artemis Landline is offline. Check server environment.',
    });
  }

  log('info', 'Transmit request received', {
    mode,
    isArchitect,
    promptLength: prompt.length,
  });

  try {
    // ─── Primary path: Agent Loop ───
    let result;
    try {
      result = await Promise.race([
        agentLoop(prompt, handshake),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Agent loop timeout')), 45000)
        ),
      ]);
    } catch (agentErr) {
      log('warn', 'Agent loop failed – falling back to sequential', {
        error: agentErr.message,
      });

      // ─── Code 13 / fallback ───
      result = await speakSequentially(prompt);
    }

    const safeVerdict = typeof result === 'string' ? result : JSON.stringify(result);

    return res.status(200).json({
      success: true,
      verdict: safeVerdict,
      mode,
      timestamp: new Date().toISOString(),
      agent: isArchitect ? 'Architect' : 'Council',
    });

  } catch (err) {
    log('error', 'Critical transmit failure', {
      error: err.message,
      stack: err.stack?.slice(0, 300),
      promptSnippet: prompt.slice(0, 100) + (prompt.length > 100 ? '...' : ''),
    });

    return res.status(500).json({
      success: false,
      error: 'Synaptic failure in Artemis bridge',
      message: 'The consensus engine encountered an internal error. Please retry or contact Architect.',
      retryAfter: 30, // hint for frontend
    });
  }
}

// ────────────────────────────────────────────────
// Vercel / Next.js config (recommended)
// ────────────────────────────────────────────────
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '1mb', // prevent abuse
    },
    responseLimit: false, // allow large verdicts if needed
  },
};
