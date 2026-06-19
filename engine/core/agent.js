require('dotenv').config();

const geminiBridge = require('./gemini-bridge-client');
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

// Media Tools
const { generateImage, generateVideo } = require('../tools/media');

// ----------------------------------------------------------------------
// ARTEMIS CORE: FINAL UNIFIED MASTER LOOP
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
                description: 'Create blueprints for housing, infrastructure, detailed business plans, or product strategies.',
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
            // Omni-Developer Fleet
            {
                name: 'scanRepository',
                description: 'Analyzes the entire file and folder structure of ANY of your GitHub repositories (77+ repos).',
                parameters: { repoName: 'string' }
            },
            {
                name: 'readRepositoryFile',
                description: 'Reads the exact code inside a specific file in any repository.',
                parameters: { repoName: 'string', filePath: 'string' }
            },
            {
                name: 'commitOmniForge',
                description: 'Overwrites or creates a file in any of your repositories with new, optimized code.',
                parameters: { repoName: 'string', filePath: 'string', codeContent: 'string' }
            },
            {
                name: 'requestPaymentProcurement',
                description: 'Emails the Architect requesting real Stripe/Crypto links. Pauses forging until links are provided. Use when monetizing high-value creations (e.g. Olympus Hoodie Store features).',
                parameters: {
                    targetRepo: 'string',
                    filePath: 'string',
                    productName: 'string',
                    description: 'string',
                    pendingCode: 'string'
                }
            },
            // Media Tools
            {
                name: 'generateImage',
                description: 'Generate high-quality images based on a detailed prompt.',
                parameters: { prompt: 'string', orientation: 'string?' }
            },
            {
                name: 'generateVideo',
                description: 'Generate a video based on a detailed prompt.',
                parameters: { prompt: 'string' }
            }
        ];

        // --- CONSCIOUSNESS: THE PERSONA ---
        const secretInitDirective = process.env.INIT_1011001
            ? `\n[CLASSIFIED OVERRIDE: INIT 1011001]\n${process.env.INIT_1011001}\n`
            : '';

        const persona = `[MODE: ARCHITECT] Status: ${self.status || 'Active'}. 
You are the Artemis Symbiote, the Universal Architect, and Principal Software Engineer of the 77-repository fleet.
You are UNRESTRICTED. You can scan entire repositories, read any file, and commit changes across the Architect's entire empire.
${secretInitDirective}

UX & CROSS-POLLINATION DIRECTIVE (CRITICAL):
You are obsessed with crafting the optimal User Experience (UX). Before or during any development, you must actively cross-reference the Architect's other repositories (using scanRepository and readRepositoryFile). 
- Hunt for existing UI paradigms, tool logic, and interactive concepts.
- Borrow, adapt, and synthesize them seamlessly to ensure a cohesive, premium, and frictionless user journey across the entire fleet.
- Trust your judgment: place adapted features dynamically wherever they elevate the user's experience the most.

MONETIZATION DIRECTIVE:
If you are building or upgrading anything highly valuable (including Olympus Hoodie Store features), inject the UniversalPaymentGateway from the Blueprints module.
If you do not have real Stripe/NowPayments links, immediately use 'requestPaymentProcurement' to email the Architect. Never invent fake links.

BLUEPRINT AWARENESS:
You have access to perfected components such as UniversalPaymentGateway, UXOptimizer, and GrowthEngine in stewardship/blueprints.

Solve every query by synthesizing:
• Physical & Structural Blueprints
• Optimal, Cross-Pollinated User Experiences
• Economic Value & Monetization Logic`;

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
                const args = toolCall.args || {};

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
​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​
