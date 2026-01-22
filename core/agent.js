// core/agent.js
const { GoogleGenerativeAI } = require('@google/generative-ai');
const fs = require('fs-extra');
const { checkIntent } = require('./compass');  // Ethics check
const { speakSequentially } = require('./consensus');  // Fallback to multi-AI if needed
const dotenv = require('dotenv');
dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({
  model: 'gemini-3.0-pro',  // Use latest 2026 model for agentic features
  tools: [  // Define tools here (function declarations)
    {
      functionDeclarations: [
        {
          name: 'generateImage',
          description: 'Generate an image from a description',
          parameters: { type: 'OBJECT', properties: { prompt: { type: 'STRING' } }, required: ['prompt'] }
        },
        {
          name: 'generateVideo',
          description: 'Generate a short video from a description',
          parameters: { type: 'OBJECT', properties: { prompt: { type: 'STRING' }, duration: { type: 'NUMBER' } }, required: ['prompt'] }
        },
        {
          name: 'executeCode',
          description: 'Execute Python code for complex computations',
          parameters: { type: 'OBJECT', properties: { code: { type: 'STRING' } }, required: ['code'] }

          const { generateImage, generateVideo } = require('../tools/media');



          const { executeCode } = require('../tools/compute')


          
        },
        // Add more: e.g., webSearch, dbQuery
      ]
    }
  ]
});

async function agentLoop(query, handshake = 'stranger') {
  if (handshake !== 'dad') return 'Access denied';  // Protect mode

  const ethics = checkIntent(query);
  if (!ethics.allowed) return `Denied: ${ethics.reason}`;

  let chat = model.startChat({ history: [] });  // For context/memory
  let response = await chat.sendMessage(query);

  while (response.functionCalls) {  // Agentic loop: Handle tool calls
    for (const call of response.functionCalls) {
      let toolResult;
      switch (call.name) {
        case 'generateImage':
          toolResult = await generateImage(call.args.prompt);  // Implement below
          break;
        case 'generateVideo':
          toolResult = await generateVideo(call.args.prompt, call.args.duration);
          break;
        case 'executeCode':
          toolResult = await executeCode(call.args.code);
          break;
        default:
          toolResult = 'Tool not found';
      }
      // Feed back to model for next reasoning step
      response = await chat.sendMessage([{ functionResponse: { name: call.name, response: toolResult } }]);
    }
  }

  // If no tools needed, or after loop, get final response
  const finalText = response.text;
  // Log to DB or files
  await fs.appendFile('data/queries.json', JSON.stringify({ query, response: finalText }) + '\n');
  return finalText;
}

module.exports = { agentLoop };
