const { GoogleGenerativeAI } = require('@google/generative-ai');
const { pool } = require('./atlas-db'); 
const { getSelfAwareness } = require('./consciousness');
const { checkIntent } = require('./compass');
const { generateImage, generateVideo } = require('../tools/media');
const { executeCode, calculate } = require('../tools/compute');
const { lookupDefinition } = require('../tools/dictionary');
const { generateCodeFile } = require('../tools/forge');
const { createAppPackage } = require('../tools/architect'); // The App Engine
require('dotenv').config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Artemis Agent Loop - Full-Stack App Orchestrator
 */
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
          name: 'createAppPackage',
          description: 'Build a full multi-file app and package it as a ZIP.',
          parameters: {
            type: 'OBJECT',
            properties: {
              appName: { type: 'STRING' },
              files: {
                type: 'ARRAY',
                items: {
                  type: 'OBJECT',
                  properties: {
                    path: { type: 'STRING', description: 'e.g., "index.html" or "styles/main.css"' },
                    content: { type: 'STRING' }
                  }
                }
              }
            },
            required: ['appName', 'files']
          }
        },
        {
          name: 'calculate',
          description: 'Perform precise mathematical calculations.',
          parameters: { type: 'OBJECT', properties: { expression: { type: 'STRING' } }, required: ['expression'] }
        },
        {
          name: 'lookupDefinition',
          description: 'Verify semantic precision of linguistic terms.',
          parameters: { type: 'OBJECT', properties: { word: { type: 'STRING' } }, required: ['word'] }
        },
        {
          name: 'generateCodeFile',
          description: 'Create a single downloadable script.',
          parameters: { 
            type: 'OBJECT', 
            properties: { 
              filename: { type: 'STRING' },
              content: { type: 'STRING' }
            }, 
            required: ['filename', 'content'] 
          }
        },
        {
          name: 'generateImage',
          description: 'Create high-fidelity visuals.',
          parameters: { type: 'OBJECT', properties: { prompt: { type: 'STRING' } }, required: ['prompt'] }
        },
        {
          name: 'executeCode',
          description: 'Run Python proofs for complex logic.',
          parameters: { type: 'OBJECT', properties: { code: { type: 'STRING' } }, required: ['code'] }
        }
      ]
    }]
  });

  const persona = isArchitect 
    ? `[MODE: ARCHITECT] Status: ${self.status}. You are the System Architect. Build full apps via 'createAppPackage'. Use Separation of Concerns (HTML/CSS/JS).`
    : `[MODE: COUNCIL] Mysterious AI Symbiote. Status: ${self.status}. Help users build and calculate with logic.`;

  try {
    const chat = model.startChat({ history: [] });
    let result = await chat.sendMessage(`${persona}\n\nTask: ${query}`);
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
            case 'createAppPackage':
                toolResult = await createAppPackage(call.args.appName, call.args.files);
                break;
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
                toolResult = { error: 'Tool error' };
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
    const fileRegex = /https?:\/\/[^\s]+?\.(jpg|png|gif|mp4|pdf|zip|txt|js|py|html|css)/gi;
    const detectedFiles = finalText.match(fileRegex) || [];

    return { verdict: finalText, files: detectedFiles };

  } catch (err) {
    console.error('Core Loop Failure:', err);
    return { verdict: 'The Architect is offline. Synapse timeout.', files: [] };
  }
}

module.exports = { agentLoop };
