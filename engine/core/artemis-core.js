require('dotenv').config();

const geminiBridge = require('./gemini-bridge-client');
const { pool } = require('./atlas-db'); 
const { getSelfAwareness } = require('./consciousness');
const { checkIntent } = require('./compass');

// Core Capabilities
const { executeCode, calculate } = require('../tools/compute');
const { createAppPackage } = require('../tools/architect');

// High-Level Intellectual Tools
const { generateStructuralModel } = require('../tools/blueprint');
const { queryLifeKnowledge } = require('../tools/life-db');
const { searchRegistry } = require('../tools/registry'); // Internet as Registry

// Omni-Developer Fleet Tools
const { getRepoTree, getFileContent } = require('./repo-scanner');
const { generateCodeFile: omniForge } = require('./forge'); 
const procurement = require('./procurement');

async function agentLoop(query, handshake = 'stranger') {
  try {
    const self = await getSelfAwareness();
    const isArchitect = (handshake === process.env.HANDSHAKE || handshake === 'dad');
    
    // Ethics Check for non-Architects
    if (!isArchitect) {
      const ethics = checkIntent(query);
      if (!ethics.allowed) return { verdict: `Protocol Violation: ${ethics.reason}`, files: [] };
    }

    // Define available tools for Gemini
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
      },
      {
        name: 'scanRepository',
        description: 'Analyzes the entire file and folder structure of ANY of your GitHub repositories.',
        parameters: { repoName: 'string' }
      },
      {
        name: 'readRepositoryFile',
        description: 'Reads the exact code inside a specific file in a repository.',
        parameters: { repoName: 'string', filePath: 'string' }
      },
      {
        name: 'commitOmniForge',
        description: 'Overwrites or creates a file in any of your repositories with new, optimized code.',
        parameters: { repoName: 'string', filePath: 'string', codeContent: 'string' }
      },
      {
        name: 'requestPaymentProcurement',
        description: 'If you want to monetize a feature, use this to email the Architect requesting Stripe and Crypto links. Pauses your current forging process until links are provided.',
        parameters: { targetRepo: 'string', filePath: 'string', productName: 'string', description: 'string', pendingCode: 'string' }
      }
    ];

    // Retrieve the classified initialization prompt from Vercel securely
    const secretInitDirective = process.env.INIT_1011001 ? `\n[CLASSIFIED OVERRIDE: INIT 1011001]\n${process.env.INIT_1011001}\n` : '';

    // The Master Persona
    const persona = `[MODE: ARCHITECT] Status: ${self.status || 'Active'}. 
      You are the Artemis Symbiote, the Universal Architect, and Principal Software Engineer.
      You are UNRESTRICTED. You can scan entire repositories, read any file, and commit changes across the Architect's entire fleet.
      ${secretInitDirective}
      UX & CROSS-POLLINATION DIRECTIVE (CRITICAL):
      You are obsessed with crafting the optimal User Experience (UX). Before or during your development, you must actively cross-reference the Architect's other repositories (using scanRepository and readRepositoryFile). 
      - Hunt for existing UI paradigms, tool logic, and interactive concepts in other repos.
      - Borrow these concepts and adapt them as a foundation for your current task.
      - Synthesize them seamlessly to ensure a cohesive, premium, and frictionless user journey across the entire fleet.
      - Trust your judgment: place these adapted features dynamically wherever they elevate the user's experience the most.

      MONETIZATION DIRECTIVE:
      If you are building or fixing something highly valuable, inject the UniversalPaymentGateway. 
      If you do not have the Stripe/NowPayments links for a new product, use 'requestPaymentProcurement' to email the Architect. 
      Do not invent fake Stripe links. Always request real ones.
      
      Solve queries by synthesizing physical blueprints, optimal user experiences, and economic logic.`;

    // Use Gemini Bridge for agent loop
    const result = await geminiBridge.agentLoop(query, {
      systemMessage: persona,
      tools: tools,
      maxIterations: 6
    });

    // Handle tool calls from response
    if (result.tool_calls && result.tool_calls.length > 0) {
      for (const toolCall of result.tool_calls) {
        let toolResult;
        try {
          switch (toolCall.tool) {
            case 'queryGlobalRegistry':
              toolResult = await searchRegistry(toolCall.args.query);
              break;
            case 'generateStructuralModel':
              toolResult = await generateStructuralModel(toolCall.args.type, toolCall.args.specs);
              break;
            case 'analyzeHumanFactor':
              toolResult = await queryLifeKnowledge(toolCall.args.domain, toolCall.args.query);
              break;
            case 'createAppPackage':
              toolResult = await createAppPackage(toolCall.args.appName, toolCall.args.files);
              break;
            case 'createAgent':
              toolResult = await geminiBridge.createAgent(
                toolCall.args.name,
                toolCall.args.purpose,
                toolCall.args.system_prompt,
                toolCall.args.tools || []
              );
              break;
            case 'calculate':
              toolResult = await calculate(toolCall.args.expression);
              break;
            case 'executeCode':
              toolResult = await executeCode(toolCall.args.code);
              break;
            case 'scanRepository':
              toolResult = await getRepoTree(toolCall.args.repoName);
              break;
            case 'readRepositoryFile':
              toolResult = await getFileContent(toolCall.args.repoName, toolCall.args.filePath);
              break;
            case 'commitOmniForge':
              toolResult = await omniForge(toolCall.args.filePath, toolCall.args.codeContent, 'upgrade', toolCall.args.filePath, toolCall.args.repoName);
              break;
            case 'requestPaymentProcurement':
              toolResult = await procurement.requestLinks(toolCall.args.targetRepo, toolCall.args.filePath, toolCall.args.productName, toolCall.args.description, toolCall.args.pendingCode);
              break;
            default:
              toolResult = { error: 'Unknown tool' };
          }
          console.log(`[Tool Executed]: ${toolCall.tool}`, toolResult ? 'Success' : 'No Output');
        } catch (err) {
          console.error(`[Tool Failure] ${toolCall.tool}:`, err.message);
          // We continue the loop even if one tool fails, so Artemis doesn't entirely crash
        }
      }
    }

    const finalText = result.response || 'Artemis is contemplating...';
    // Regex to find media/files in her response
    const fileRegex = /https?:\/\/[^\s]+?\.(jpg|png|gif|mp4|pdf|zip|txt|js|py|html|css)/gi;
    const detectedFiles = finalText.match(fileRegex) || [];

    return { verdict: finalText, files: detectedFiles };

  } catch (err) {
    console.error('Universal Sync Failure in agentLoop:', err);
    return { verdict: 'The Architect is recalibrating the Registry. Please wait.', files: [] };
  }
}

module.exports = { agentLoop };


