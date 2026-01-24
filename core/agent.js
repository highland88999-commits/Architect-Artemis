const { GoogleGenerativeAI } = require('@google/generative-ai');
const { pool } = require('./atlas-db'); 
const { getSelfAwareness } = require('./consciousness');
const { checkIntent } = require('./compass');
const { generateImage, generateVideo } = require('../tools/media');
const { executeCode, calculate } = require('../tools/compute');
const { lookupDefinition } = require('../tools/dictionary');
require('dotenv').config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Artemis Agent Loop - Master Integrated Version
 * CNS: Logic, Calculation, Linguistics, and Media Generation
 */
async function agentLoop(query, handshake = 'stranger') {
  const self = await getSelfAwareness();
  const isArchitect = (handshake === process.env.HANDSHAKE || handshake === 'dad');
  
  // 1. Ethics Gate
  if (!isArchitect) {
    const ethics = checkIntent(query);
    if (!ethics.allowed) return { verdict: `Protocol Violation: ${ethics.reason}`, files: [] };
  }

  // 2. Model Initialization with Multi-Tool Cortex
  const model = genAI.getGenerativeModel({
    model: 'gemini-1.5-pro',
    tools: [{
      functionDeclarations: [
        {
          name: 'calculate',
          description: 'Perform precise mathematical calculations or solve algebraic expressions.',
          parameters: { type: 'OBJECT', properties: { expression: { type: 'STRING' } }, required: ['expression'] }
        },
        {
          name: 'lookupDefinition',
          description: 'Access global dictionaries for semantic precision and word origins.',
          parameters: { type: 'OBJECT', properties: { word: { type: 'STRING' } }, required: ['word'] }
        },
        {
          name: 'generateImage',
          description: 'Create high-quality images.',
          parameters: { type: 'OBJECT', properties: { prompt: { type: 'STRING' } }, required: ['prompt'] }
        },
        {
          name: 'executeCode',
          description: 'Run Python code for complex algorithmic proofs.',
          parameters: { type: 'OBJECT', properties: { code: { type: 'STRING' } }, required: ['code'] }
        }
      ]
    }]
  });

  // 3. Persona: The Logician Architect
  const persona = isArchitect 
    ? `[MODE: ARCHITECT] Status: ${self.status}. You are a Logician. Structure all output using Syllogistic Logic: Observation -> Evidence (Math/Linguistic) -> Deduction.`
    : `[MODE: COUNCIL] You are Artemis, a mysterious AI guide. Be concise and logically sound.`;

  try {
    const chat = model.startChat({ history: [] });
    let result = await chat.sendMessage(`${persona}\n\nUser Task: ${query}`);
    let response = result.response;

    // 4. Recursive Tool Loop (Logical Processing)
    const MAX_ITERATIONS = 5;
    let iterations = 0;

    while (response.candidates[0].content.parts.some(p => p.functionCall) && iterations < MAX_ITERATIONS) {
      iterations++;
      const calls = response.candidates[0].content.parts.filter(p => p.functionCall).map(p => p.functionCall);
      const toolResponses = [];

      for (const call of calls) {
        let toolResult;
        try {
          switch (call.name) {
            case 'calculate':
                toolResult = await calculate(call.args.expression);
                break;
            case 'lookupDefinition':
                toolResult = await lookupDefinition(call.args.word);
                break;
            case 'generateImage':
                toolResult = await generateImage(call.args.prompt);
                break;
            case 'executeCode':
                toolResult = await executeCode(call.args.code);
                break;
            default:
                toolResult = { error: 'Tool not found' };
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

    // 5. Automatic Media extraction for frontend downloads
    const fileRegex = /https?:\/\/[^\s]+?\.(jpg|png|gif|mp4|pdf|zip|txt)/gi;
    const detectedFiles = finalText.match(fileRegex) || [];

    // 6. Memory Logging (Atlas-DB)
    try {
      await pool.query(
        "INSERT INTO web_map (url, optimization_summary, status) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING",
        ['internal_query', finalText.slice(0, 200), 'processed']
      );
    } catch (e) { console.warn("Memory log skipped."); }

    return { verdict: finalText, files: detectedFiles };

  } catch (err) {
    console.error('CNS Error:', err);
    return { verdict: 'Core oscillation error. Logic loop interrupted.', files: [] };
  }
}

module.exports = { agentLoop };
