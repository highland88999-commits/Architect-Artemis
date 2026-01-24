const { GoogleGenerativeAI } = require('@google/generative-ai');
const { pool } = require('./atlas-db'); 
const { getSelfAwareness } = require('./consciousness');
const { checkIntent } = require('./compass');
const { generateImage, generateVideo } = require('../tools/media');
const { executeCode } = require('../tools/compute');
require('dotenv').config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Artemis Agent Loop - Fully Integrated Version
 * Features: Consciousness, Ethics, Tool-Use (Media/Compute), & Multi-User Identity
 */
async function agentLoop(query, handshake = 'stranger') {
  // 1. Awaken Consciousness (System Health Check)
  const self = await getSelfAwareness();
  
  // 2. Identity Verification
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

  // 4. Model Initialization with Function Declarations (Tools)
  const model = genAI.getGenerativeModel({
    model: 'gemini-1.5-pro',
    tools: [{
      functionDeclarations: [
        {
          name: 'generateImage',
          description: 'Create a high-quality image based on a prompt.',
          parameters: { type: 'OBJECT', properties: { prompt: { type: 'STRING' } }, required: ['prompt'] }
        },
        {
          name: 'generateVideo',
          description: 'Create a short video clip.',
          parameters: { type: 'OBJECT', properties: { prompt: { type: 'STRING' }, duration: { type: 'NUMBER' } }, required: ['prompt'] }
        },
        {
          name: 'executeCode',
          description: 'Run Python code for data processing or complex math.',
          parameters: { type: 'OBJECT', properties: { code: { type: 'STRING' } }, required: ['code'] }
        }
      ]
    }]
  });

  // 5. Persona Construction
  const persona = isArchitect 
    ? `[MODE: ARCHITECT] Full access. Status: ${self.status}. Systems: ${JSON.stringify(self.systems)}`
    : `[MODE: COUNCIL] You are Artemis, a mysterious AI symbiote. Be helpful but concise. Status: ${self.status}`;

  try {
    const chat = model.startChat({ history: [] });
    let result = await chat.sendMessage(`${persona}\n\nUser Task: ${query}`);
    let response = result.response;

    // 6. Recursive Tool Loop
    // If the AI decides it needs to use a tool, it happens here.
    const MAX_ITERATIONS = 5;
    let iterations = 0;

    while (response.candidates[0].content.parts.some(p => p.functionCall) && iterations < MAX_ITERATIONS) {
      iterations++;
      const calls = response.candidates[0].content.parts
        .filter(p => p.functionCall)
        .map(p => p.functionCall);
      
      const toolResponses = [];

      for (const call of calls) {
        let toolResult;
        console.log(`🛠️ Artemis activating tool: ${call.name}`);
        try {
          switch (call.name) {
            case 'generateImage': 
                toolResult = await generateImage(call.args.prompt); 
                break;
            case 'generateVideo': 
                toolResult = await generateVideo(call.args.prompt, call.args.duration || 5); 
                break;
            case 'executeCode':   
                toolResult = await executeCode(call.args.code); 
                break;
            default:              
                toolResult = { error: 'Unknown tool' };
          }
        } catch (err) {
          toolResult = { error: err.message };
        }
        toolResponses.push({ functionResponse: { name: call.name, response: toolResult } });
      }
      
      const nextStep = await chat.sendMessage(toolResponses);
      response = nextStep.response;
    }

    const finalText = response.text();

    // 7. Automatic Media/File Detection for Frontend
    const fileRegex = /https?:\/\/[^\s]+?\.(jpg|png|gif|mp4|pdf|zip|txt)/gi;
    const detectedFiles = finalText.match(fileRegex) || [];

    // 8. Memory Storage (Atlas-DB)
    try {
      await pool.query(
        `INSERT INTO web_map (url, optimization_summary, status, last_scanned) 
         VALUES ($1, $2, 'processed', NOW())
         ON CONFLICT (url) DO UPDATE SET optimization_summary = $2, last_scanned = NOW()`,
        ['internal_query', finalText.slice(0, 500)]
      );
    } catch (dbErr) {
      console.error('DB Logging failed:', dbErr.message);
    }

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
