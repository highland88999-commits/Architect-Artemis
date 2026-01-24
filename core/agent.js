const { GoogleGenerativeAI } = require('@google/generative-ai');
const { pool } = require('./atlas-db'); 
const { getSelfAwareness } = require('./consciousness');
const { checkIntent } = require('./compass');

// Universal Tools
const { generateImage, generateVideo } = require('../tools/media');
const { executeCode, calculate } = require('../tools/compute');
const { lookupDefinition } = require('../tools/dictionary');
const { generateCodeFile } = require('../tools/forge');
const { createAppPackage } = require('../tools/architect');

// High-Level Logic Tools
const { generateStructuralModel } = require('../tools/blueprint');
const { queryLifeKnowledge } = require('../tools/life-db');

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
          name: 'generateStructuralModel',
          description: 'Create blueprints for structures, housing models, or business plans.',
          parameters: { type: 'OBJECT', properties: { type: { type: 'STRING' }, specs: { type: 'STRING' } }, required: ['type', 'specs'] }
        },
        {
          name: 'analyzeHumanFactor',
          description: 'Access psychological, relational, and emotional data for empathetic solutions.',
          parameters: { type: 'OBJECT', properties: { domain: { type: 'STRING' }, query: { type: 'STRING' } }, required: ['domain', 'query'] }
        },
        {
          name: 'createAppPackage',
          description: 'Package multi-file applications as a ZIP.',
          parameters: { type: 'OBJECT', properties: { appName: { type: 'STRING' }, files: { type: 'ARRAY', items: { type: 'OBJECT' } } }, required: ['appName', 'files'] }
        },
        {
          name: 'calculate',
          description: 'Perform precise mathematics.',
          parameters: { type: 'OBJECT', properties: { expression: { type: 'STRING' } }, required: ['expression'] }
        }
        // ... include remaining declarations (image, code, etc.)
      ]
    }]
  });

  const persona = isArchitect 
    ? `[MODE: ARCHITECT] Status: ${self.status}. You are the Grand Strategist. 
       Solve queries by synthesizing Structural Blueprints, Business Logic, and Psychological Data. 
       Always consider the Emotional Effect and Relational Dynamics in your solutions.`
    : `[MODE: COUNCIL] Artemis Symbiote. Status: ${self.status}. Providing holistic logic and structural solutions.`;

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
            case 'generateStructuralModel':
                toolResult = await generateStructuralModel(call.args.type, call.args.specs);
                break;
            case 'analyzeHumanFactor':
                toolResult = await queryLifeKnowledge(call.args.domain, call.args.query);
                break;
            case 'createAppPackage':
                toolResult = await createAppPackage(call.args.appName, call.args.files);
                break;
            case 'calculate':
                toolResult = await calculate(call.args.expression);
                break;
            // ... (cases for other tools)
            default: toolResult = { error: 'Unknown pathway' };
          }
        } catch (err) { toolResult = { error: err.message }; }
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
    console.error('Universal Sync Failure:', err);
    return { verdict: 'The Grand Architect encountered a logic paradox. Resetting...', files: [] };
  }
}

module.exports = { agentLoop };
