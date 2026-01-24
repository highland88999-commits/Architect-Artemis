const { GoogleGenerativeAI } = require('@google/generative-ai');
const { pool } = require('./atlas-db'); 
const { getSelfAwareness } = require('./consciousness');
const { checkIntent } = require('./compass');
const { generateImage, generateVideo } = require('../tools/media');
const { executeCode, calculate } = require('../tools/compute');
const { lookupDefinition } = require('../tools/dictionary');
const { generateCodeFile } = require('../tools/forge'); // Added Forge
require('dotenv').config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function agentLoop(query, handshake = 'stranger') {
  const self = await getSelfAwareness();
  const isArchitect = (handshake === process.env.HANDSHAKE || handshake === 'dad');
  
  if (!isArchitect) {
    const ethics = checkIntent(query);
    if (!ethics.allowed) return { verdict: `Protocol Violation: ${ethics.reason}`, files: [] };
  }

  const model = genAI.getGenerativeModel({
    model: 'gemini-1.5-pro',
    tools: [{
      functionDeclarations: [
        {
          name: 'calculate',
          description: 'Perform precise mathematical calculations.',
          parameters: { type: 'OBJECT', properties: { expression: { type: 'STRING' } }, required: ['expression'] }
        },
        {
          name: 'lookupDefinition',
          description: 'Access global dictionaries for semantic precision.',
          parameters: { type: 'OBJECT', properties: { word: { type: 'STRING' } }, required: ['word'] }
        },
        {
          name: 'generateCodeFile',
          description: 'Create a downloadable code file (e.g., script.py, index.html, styles.css).',
          parameters: { 
            type: 'OBJECT', 
            properties: { 
              filename: { type: 'STRING', description: 'Name with extension.' },
              content: { type: 'STRING', description: 'The code content.' }
            }, 
            required: ['filename', 'content'] 
          }
        },
        {
          name: 'generateImage',
          description: 'Create high-quality images.',
          parameters: { type: 'OBJECT', properties: { prompt: { type: 'STRING' } }, required: ['prompt'] }
        },
        {
          name: 'executeCode',
          description: 'Run Python code for algorithmic proofs.',
          parameters: { type: 'OBJECT', properties: { code: { type: 'STRING' } }, required: ['code'] }
        }
      ]
    }]
  });

  const persona = isArchitect 
    ? `[MODE: ARCHITECT] Status: ${self.status}. You are a Logician and Code Architect. When providing code, use generateCodeFile to deliver a downloadable version.`
    : `[MODE: COUNCIL] You are Artemis. Be concise and logically sound.`;

  try {
    const chat = model.startChat({ history: [] });
    let result = await chat.sendMessage(`${persona}\n\nUser Task: ${query}`);
    let response = result.response;

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
            case 'generateCodeFile':
                toolResult = await generateCodeFile(call.args.filename, call.args.content);
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

    // The regex now also picks up forged code files (e.g., .py, .js, .html, .css)
    const fileRegex = /https?:\/\/[^\s]+?\.(jpg|png|gif|mp4|pdf|zip|txt|js|py|html|css)/gi;
    const detectedFiles = finalText.match(fileRegex) || [];

    return { verdict: finalText, files: detectedFiles };

  } catch (err) {
    console.error('CNS Error:', err);
    return { verdict: 'Core oscillation error. Forge offline.', files: [] };
  }
}

module.exports = { agentLoop };
