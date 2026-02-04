// api/midas-guidance.js
/**
 * MIDAS GUIDANCE ENDPOINT
 * Provides golden-path recovery advice when agents encounter errors or confusion.
 * Acts as the "wise oracle" fallback for the Artemis system.
 */

require('dotenv').config();
const Midas = require('../core/midas-guide');

const LANDLINE_KEY = process.env.ARTEMIS_LANDLINE;
const MIDAS_TIMEOUT_MS = parseInt(process.env.MIDAS_TIMEOUT_MS, 10) || 15000;

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
    `[MIDAS] ${message}`,
    meta
  );
  // Optional: append to file or send to observability (Loki, Sentry, etc.)
}

export default async function handler(req, res) {
  // ─── Security & early exits ───
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  if (LANDLINE_KEY !== 'CONNECTED') {
    log('warn', 'Landline disconnected – access denied');
    return res.status(503).json({
      error: 'Access Denied',
      message: 'Artemis Landline is not CONNECTED. Check environment variables.',
    });
  }

  let body;
  try {
    body = await req.json();
  } catch (err) {
    log('warn', 'Invalid JSON body', { error: err.message });
    return res.status(400).json({ error: 'Invalid JSON payload' });
  }

  const { context, errorLog } = body;

  // ─── Input validation ───
  if (!context || typeof context !== 'string' || context.trim().length === 0) {
    log('warn', 'Missing or empty context', { body });
    return res.status(400).json({ error: 'Valid "context" string is required' });
  }

  if (errorLog && typeof errorLog !== 'string') {
    log('warn', 'Invalid errorLog type – ignoring', { errorLog });
  }

  log('info', 'Midas guidance requested', {
    contextLength: context.length,
    hasErrorLog: !!errorLog,
  });

  try {
    // ─── Call Midas with timeout protection ───
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Midas guidance timeout')), MIDAS_TIMEOUT_MS)
    );

    const guidancePromise = Midas.provideGuidance(context, errorLog || '');

    const goldenPath = await Promise.race([guidancePromise, timeoutPromise]);

    // Validate Midas output shape (defensive)
    if (!goldenPath || typeof goldenPath !== 'object') {
      throw new Error('Invalid guidance format from Midas');
    }

    const safeResponse = {
      agent: 'MIDAS',
      message: 'The Golden Path has been revealed.',
      guidance: goldenPath.guidance || 'No specific guidance available.',
      action: goldenPath.action || 'Observe and retry with adjusted parameters.',
      confidence: goldenPath.confidence || 0.7, // optional – add if Midas supports it
      style: 'GOLDEN_OVERLAY',
      timestamp: new Date().toISOString(),
    };

    log('info', 'Midas guidance delivered', {
      guidanceLength: safeResponse.guidance.length,
      action: safeResponse.action,
    });

    return res.status(200).json(safeResponse);

  } catch (err) {
    log('error', 'Midas guidance failed', {
      error: err.message,
      stack: err.stack?.slice(0, 300),
      contextSnippet: context.slice(0, 100) + '...',
    });

    const isTimeout = err.message.includes('timeout');
    const status = isTimeout ? 504 : 500;

    return res.status(status).json({
      error: isTimeout ? 'Midas Guidance Timeout' : 'Midas Touch Failed',
      message: isTimeout
        ? 'Guidance generation took too long – try a shorter context or retry.'
        : 'Synaptic break in Midas engine. Please try again or escalate to Architect.',
      retryAfter: isTimeout ? 30 : undefined, // seconds hint
    });
  }
}
