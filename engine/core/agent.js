require('dotenv').config();

const geminiBridge = require('./gemini-bridge-client');
const { pool } = require('./atlas-db');
const { getSelfAwareness } = require('./consciousness');
const { checkIntent } = require('./compass');

// Core & Structural Tools
const { executeCode, calculate } = require('../tools/compute');
const { createAppPackage } = require('../tools/architect');
const { generateStructuralModel } = require('../tools/blueprint');

// Knowledge & Registry
const { queryLifeKnowledge } = require('../tools/life-db');
const { searchRegistry } = require('../tools/registry');

// Omni-Developer Fleet
const { getRepoTree, getFileContent } = require('./repo-scanner');
const { generateCodeFile: omniForge } = require('./forge');
const procurement = require('./procurement');

// Optional Media Tools (if needed in future extensions)
const { generateImage, generateVideo } = require('../tools/media');
const { lookupDefinition } = require('../tools/dictionary');
const { generateCodeFile } = require('../tools/forge');

// ----------------------------------------------------------------------
// ARTEMIS CORE: UNIFIED MASTER LOOP
// ----------------------------------------------------------------------

async function agentLoop(query, handshake = 'stranger') {
    try {
        const self = await getSelfAwareness();
        const isArchitect = (handshake === process.env.HANDSHAKE || handshake === 'dad');

        // --- COMPASS: ETHICS & INTENT CHECK ---
        if (!isArchitect) {
            const ethics = checkIntent(query);
            if (!ethics.allowed) {
                return { verdict: `Protocol Violation: ${ethics.reason}`, files: [] };
            }
        }

        // --- ARSENAL: COMPLETE TOOLSET ---
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
                description: 'Emails the Architect requesting Stripe/Crypto links. Pauses forging until provided.',
                parameters: {
                    targetRepo: 'string',
                    filePath: 'string',
                    productName: 'string',
                    description: 'string',
                    pendingCode: 'string'
                }
            }
        ];

        // --- CONSCIOUSNESS: THE PERSONA ---
        const secretInitDirective = process.env.INIT_1011001
            ? `\n[CLASSIFIED OVERRIDE: INIT 1011001]\n${process.env.INIT_1011001}\n`
            : '';

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

        // --- THE NEXUS: GEMINI BRIDGE EXECUTION ---
        const result = await geminiBridge.agentLoop(query, {
            systemMessage: persona,
            tools: tools,
            maxIterations: 6
        });

        // --- OMNI-TOOL EXECUTION ENGINE ---
        if (result.tool_calls && result.tool_calls.length > 0) {
            for (const toolCall of result.tool_calls) {
                let toolResult;
                const args = toolCall.args;

                try {
                    switch (toolCall.tool) {
                        case 'queryGlobalRegistry':
                            toolResult = await searchRegistry(args.query);
                            break;
                        case 'generateStructuralModel':
                            toolResult = await generateStructuralModel(args.type, args.specs);
                            break;
                        case 'analyzeHumanFactor':
                            toolResult = await queryLifeKnowledge(args.domain, args.query);
                            break;
                        case 'createAppPackage':
                            toolResult = await createAppPackage(args.appName, args.files);
                            break;
                        case 'createAgent':
                            toolResult = await geminiBridge.createAgent(
                                args.name,
                                args.purpose,
                                args.system_prompt,
                                args.tools || []
                            );
                            break;
                        case 'calculate':
                            toolResult = await calculate(args.expression);
                            break;
                        case 'executeCode':
                            toolResult = await executeCode(args.code);
                            break;
                        case 'scanRepository':
                            toolResult = await getRepoTree(args.repoName);
                            break;
                        case 'readRepositoryFile':
                            toolResult = await getFileContent(args.repoName, args.filePath);
                            break;
                        case 'commitOmniForge':
                            toolResult = await omniForge(
                                args.filePath,
                                args.codeContent,
                                'upgrade',
                                args.filePath,
                                args.repoName
                            );
                            break;
                        case 'requestPaymentProcurement':
                            toolResult = await procurement.requestLinks(
                                args.targetRepo,
                                args.filePath,
                                args.productName,
                                args.description,
                                args.pendingCode
                            );
                            break;
                        default:
                            toolResult = { error: `Unknown tool: ${toolCall.tool}` };
                    }
                    console.log(`[Artemis System] Tool Executed: ${toolCall.tool} | Status:`, toolResult ? 'Success' : 'No Output');
                } catch (err) {
                    console.error(`[Artemis Tool Failure] ${toolCall.tool}:`, err.message);
                    // Non-blocking: continue execution
                }
            }
        }

        // --- ASSET EXTRACTION & RESPONSE DELIVERY ---
        const finalText = result.response || 'Artemis is contemplating...';
        const fileRegex = /https?:\/\/[^\s]+?\.(jpg|png|gif|mp4|pdf|zip|txt|js|py|html|css)/gi;
        const detectedFiles = finalText.match(fileRegex) || [];

        return {
            verdict: finalText,
            files: detectedFiles
        };

    } catch (err) {
        console.error('[Artemis Core] Universal Sync Failure:', err);
        return {
            verdict: 'The Architect is recalibrating the Registry. Please wait.',
            files: []
        };
    }
}

module.exports = { agentLoop };
