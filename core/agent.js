const { GoogleGenerativeAI } = require('@google/generative-ai');
const { pool } = require('./atlas-db'); // Connect to Supabase Memory
const { checkIntent } = require('./compass');
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
        description: 'Generate a high-fidelity image using Replicate/DALL-E',
        parameters: { type: 'OBJECT', properties: { prompt: { type: 'STRING' } }, required: ['prompt'] }
      },
      {
        name: 'generateVideo',
        description: 'Generate a short video clip',
        parameters: { type: 'OBJECT', properties: { prompt: { type: 'STRING' }, duration: { type: 'NUMBER' } }, required: ['prompt'] }
      },
      {
        name: 'executeCode',
        description: 'Run Python/JS for complex math or data processing',
        parameters: { type: 'OBJECT', properties: { code: { type: 'STRING' } }, required: ['code'] }
      }
    ]
  }]
});

async function agentLoop(query, handshake = 'stranger') {
  // 1. Identity Verification
  if (handshake !== process.env.HANDSHAKE) return 'Identify yourself. Connection refused.';

  // 2. Ethics Gate
  const ethics = checkIntent(query);
  if (!ethics.allowed) return `Protocol Violation: ${ethics.reason}`;

  try {
    const chat = model.startChat({ history: [] });
    let result = await chat.sendMessage(query);

    // 3. Recursive Tool Loop (Handling Multi-step Reasoning)
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

        responses.push({
          functionResponse: { name: call.name, response: toolResult }
        });
      }

      result = await chat.sendMessage(responses);
    }

    const finalText = result.response.text();

    // 4. Save to Permanent Memory (Supabase) instead of local JSON
    await pool.query(
      "INSERT INTO web_map (url, optimization_summary, last_scanned) VALUES ($1, $2, NOW())",
      ['internal_query', `Query: ${query} | Result: ${finalText}`]
    );

    return finalText;
  } catch (err) {
    console.error('Agent loop error:', err);
    return 'Core oscillation error. Check logs.';
  }
}

module.exports = { agentLoop };
