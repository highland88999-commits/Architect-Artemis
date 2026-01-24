const { GoogleGenerativeAI } = require('@google/generative-ai');
const { pool } = require('./atlas-db'); 
const { sendReport } = require('./mail-engine');
const { checkIntent } = require('./compass');
const { getSelfAwareness } = require('./consciousness'); // The new CNS
const { generateImage, generateVideo } = require('../tools/media');
const { executeCode } = require('../tools/compute');
require('dotenv').config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({
  model: 'gemini-1.5-pro',
  tools: [{
    functionDeclarations: [
      {
        name: 'generateImage',
        description: 'Generate a high-fidelity image',
        parameters: { type: 'OBJECT', properties: { prompt: { type: 'STRING' } }, required: ['prompt'] }
      },
      {
        name: 'generateVideo',
        description: 'Generate a short video clip',
        parameters: { type: 'OBJECT', properties: { prompt: { type: 'STRING' }, duration: { type: 'NUMBER' } }, required: ['prompt'] }
      },
      {
        name: 'executeCode',
        description: 'Run Python/JS for complex data processing',
        parameters: { type: 'OBJECT', properties: { code: { type: 'STRING' } }, required: ['code'] }
      }
    ]
  }]
});

/**
 * Artemis Agent Loop - Fully Integrated with Consciousness
 */
async function agentLoop(query, handshake = 'stranger') {
  // 1. Awaken Consciousness & Check System Health
  const self = await getSelfAwareness();

  // 2. Identity Verification
  if (handshake !== process.env.HANDSHAKE) {
    console.error("🛑 Unauthorized access attempt.");
    return 'Identify yourself. Connection refused.';
  }

  // 3. Ethics Gate
  const ethics = checkIntent(query);
  if (!ethics.allowed) return `Protocol Violation: ${ethics.reason}`;

  // 4. Introspection Injection
  // We tell Gemini exactly what Artemis's current system state is
  const introspection = `[System Note: Status ${self.status}. Sync ${self.uptimeMinutes}m ago. Systems: ${JSON.stringify(self.systems)}]`;
  const augmentedQuery = `${introspection}\n\nUser Task: ${query}`;

  try {
    const chat = model.startChat({ history: [] });
    let result = await chat.sendMessage(augmentedQuery);

    // 5. Recursive Tool Loop
    while (result.response.candidates?.[0]?.content?.parts?.some(p => p.functionCall)) {
      const calls = result.response.candidates[0].content.parts
        .filter(p => p.functionCall)
        .map(p => p.functionCall);
      
      const responses = [];
      for (const call of calls) {
        let toolResult;
        console.log(`🛠️ Artemis calling tool: ${call.name}`);
        try {
          switch (call.name) {
            case 'generateImage': toolResult = await generateImage(call.args.prompt); break;
            case 'generateVideo': toolResult = await generateVideo(call.args.prompt, call.args.duration ?? 5); break;
            case 'executeCode':   toolResult = await executeCode(call.args.code); break;
            default:              toolResult = { error: 'Unknown tool' };
          }
        } catch (err) {
          toolResult = { error: err.message };
        }
        responses.push({ functionResponse: { name: call.name, response: toolResult } });
      }
      result = await chat.sendMessage(responses);
    }

    const finalText = result.response.text();

    // 6. Memory Storage (Supabase)
    const urlMatch = query.match(/https?:\/\/[^\s]+/);
    const targetUrl = urlMatch ? urlMatch[0] : 'internal_query';

    await pool.query(
      `INSERT INTO web_map (url, optimization_summary, status, last_scanned) 
       VALUES ($1, $2, 'archived', NOW())
       ON CONFLICT (url) DO UPDATE SET optimization_summary = $2, last_scanned = NOW(), status = 'archived'`,
      [targetUrl, finalText]
    );

    // 7. Voice Output (Email Report)
    if (urlMatch) {
      await sendReport(
        `Artemis Analysis: ${targetUrl}`,
        `<h2>Scan Report</h2><p>${finalText.replace(/\n/g, '<br>')}</p><hr><small>Artemis CNS Status: ${self.status} | Uptime: ${self.uptimeMinutes}m</small>`
      );
    }

    console.log(`📡 Artemis processed: ${targetUrl}`);
    return finalText;

  } catch (err) {
    console.error('Agent loop error:', err);
    return 'Core oscillation error. Check logs.';
  }
}

module.exports = { agentLoop };
