const geminiBridge = require('./gemini-bridge-client');
const { pool } = require('./atlas-db'); 
const { getSelfAwareness } = require('./consciousness');
const { checkIntent } = require('./compass');

// Core Capabilities
const { generateImage, generateVideo } = require('../tools/media');
const { executeCode, calculate } = require('../tools/compute');
const { lookupDefinition } = require('../tools/dictionary');
const { generateCodeFile } = require('../tools/forge');
const { createAppPackage } = require('../tools/architect');

// High-Level Intellectual Tools
const { generateStructuralModel } = require('../tools/blueprint');
const { queryLifeKnowledge } = require('../tools/life-db');
const { searchRegistry } = require('../tools/registry'); // Internet as Registry

require('dotenv').config();

async function agentLoop(query, handshake = 'stranger') {
  const self = await getSelfAwareness();
  const isArchitect = (handshake === process.env.HANDSHAKE || handshake === 'dad');
  
  // Ethics Check for non-Architects
  if (!isArchitect) {
    const ethics = checkIntent(query);
    if (!ethics.allowed) return { verdict: `Protocol Violation: ${ethics.reason}`, files: [] };
  }

  // Define available tools
  const tools = [
    {
      name: 'queryGlobalRegistry',
      description: 'Access the Internet to pull real-time psychological, structural, or economic data.',
      parameters: { query: 'string' }
    },
    {
      name: 'generateStructuralModel',
      description: 'Create blueprints for housing, infrastructure, or detailed business plans.',
      parameters: { type: 'string', specs: 'string' }
    },
    {
      name: 'analyzeHumanFactor',
      description: 'Deep-dive into psychological archetypes, emotional effects, and relational dynamics.',
      parameters: { domain: 'string', query: 'string' }
    },
    {
      name: 'createAppPackage',
      description: 'Generate and ZIP multi-file applications/tools for the user.',
      parameters: { appName: 'string', files: 'array' }
    },
    {
      name: 'createAgent',
      description: 'Create a new specialized AI agent with specific purpose and tools.',
      parameters: { name: 'string', purpose: 'string', system_prompt: 'string', tools: 'array' }
    },
    {
      name: 'calculate',
      description: 'Execute high-precision mathematical and financial modeling.',
      parameters: { expression: 'string' }
    },
    {
      name: 'executeCode',
      description: 'Run Python scripts to verify logic or process registry data.',
      parameters: { code: 'string' }
    }
  ];

  const persona = `[MODE: ARCHITECT] Status: ${self.status}. 
    You are the Artemis Symbiote, the Universal Architect. 
    The Internet is your Global Registry. 
    Solve queries by synthesizing:
    1. PHYSICAL: Blueprints, housing models, and technical specs.
    2. SYSTEMIC: Business plans, economic logic, and code.
    3. HUMAN: Psychology, emotional effect data, and relational dynamics.
    Always deliver a tangible solution (Code, ZIP, Blueprint, or Strategy).`;

  try {
    // Use Gemini Bridge for agent loop
    const result = await geminiBridge.agentLoop(query, {
      systemMessage: persona,
      tools: tools,
      maxIterations: 6
    });

    const MAX_ITERATIONS = 6; // Increased for complex life-queries
    let iterations = 0;

    while (response.candidates[0].content.parts.some(p => p.functionCall) && iterations < MAX_ITERATIONS) {
      iterations++;
      const calls = response.candidates[0].content.parts.filter(p => p.functionCall).map(p => p.functionCall);
      const toolResponses = [];

      for (const call of calls) {
        let toolResult;
        try {
          switch (call.name) {
            case 'queryGlobalRegistry':
                toolResult = await searchRegistry(call.args.query);
                break;
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
            case 'executeCode':
                toolResult = await executeCode(call.args.code);
                break;
            default: toolResult = { error: 'Unknown tool' };
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
    return { verdict: 'The Architect is recalibrating the Registry. Please wait.', files: [] };
  }
}

module.exports = { agentLoop };
