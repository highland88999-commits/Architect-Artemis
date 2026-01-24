const { GoogleGenerativeAI } = require('@google/generative-ai');
const { pool } = require('./atlas-db'); 
const { getSelfAwareness } = require('./consciousness');
const { checkIntent } = require('./compass');
// Note: If you have media tools specifically defined in media.js, 
// they can be called by the model if tools are initialized.
require('dotenv').config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
// We use 1.5-pro for high-reasoning tasks and tool handling
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });

/**
 * Artemis Agent Loop - Fully Integrated & Public Accessible
 * Merged version: Consciousness + Ethics + Identity + Media Extraction
 */
async function agentLoop(query, handshake = 'stranger') {
  // 1. Awaken Consciousness (System Health Check)
  const self = await getSelfAwareness();
  
  // 2. Identity Verification (Handshake)
  // 'dad' or your ENV variable unlocks Architect mode
  const isArchitect = (handshake === process.env.HANDSHAKE || handshake === 'dad');
  
  // 3. Ethics Gate (Mandatory for Council/Public)
  if (!isArchitect) {
    const ethics = checkIntent(query);
    if (!ethics.allowed) {
      return { 
        verdict: `Protocol Violation: ${ethics.reason}`, 
        files: [] 
      };
    }
  }

  // 4. Construct System Persona & Introspection
  // Architect gets deep system stats; Council gets the mysterious guide persona.
  const persona = isArchitect 
    ? `[MODE: ARCHITECT] Full access granted. System Status: ${self.status}. Systems: ${JSON.stringify(self.systems)}`
    : `[MODE: COUNCIL] You are Artemis, a mysterious AI symbiote. Be helpful but concise. Status: ${self.status}`;

  try {
    const chat = model.startChat({ history: [] });
    
    // Inject persona and system state into the query
    const augmentedQuery = `${persona}\n\nUser Task: ${query}`;
    const result = await chat.sendMessage(augmentedQuery);
    const finalText = result.response.text();

    // 5. Automatic Media/File Detection for Frontend
    // This looks for URLs in the AI's response to trigger the Download button
    const fileRegex = /https?:\/\/[^\s]+?\.(jpg|png|gif|mp4|pdf|zip|txt)/gi;
    const detectedFiles = finalText.match(fileRegex) || [];

    // 6. Memory Storage (Atlas-DB / Supabase)
    try {
      await pool.query(
        `INSERT INTO web_map (url, optimization_summary, status, last_scanned) 
         VALUES ($1, $2, 'processed', NOW())
         ON CONFLICT (url) DO UPDATE SET optimization_summary = $2, last_scanned = NOW()`,
        ['internal_query', finalText.slice(0, 500)]
      );
    } catch (dbErr) {
      console.error('DB Logging failed (non-critical):', dbErr.message);
    }

    // 7. Structured Return for the Bridge
    return {
        verdict: finalText,
        files: detectedFiles
    };

  } catch (err) {
    console.error('Artemis Agent Loop Critical Error:', err);
    return { 
      verdict: 'Core oscillation error. The synapse failed to fire. Please retry.', 
      files: [] 
    };
  }
}

module.exports = { agentLoop };
