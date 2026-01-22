// core/agent.js
const { GoogleGenerativeAI } = require('@google/generative-ai');
const fs = require('fs-extra');
const { checkIntent } = require('./compass');
const { generateImage, generateVideo } = require('../tools/media');
const { executeCode } = require('../tools/compute');
require('dotenv').config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const model = genAI.getGenerativeModel({
  model: 'gemini-1.5-pro',
  tools: [{
    functionDeclarations: [
      {
        name: 'generateImage',
        description: 'Generate an image from a description',
        parameters: {
          type: 'OBJECT',
          properties: { prompt: { type: 'STRING' } },
          required: ['prompt']
        }
      },
      {
        name: 'generateVideo',
        description: 'Generate a short video from a description',
        parameters: {
          type: 'OBJECT',
          properties: {
            prompt: { type: 'STRING' },
            duration: { type: 'NUMBER' }
          },
          required: ['prompt']
        }
      },
      {
        name: 'executeCode',
        description: 'Execute Python code for complex computations',
        parameters: {
          type: 'OBJECT',
          properties: { code: { type: 'STRING' } },
          required: ['code']
        }
      }
    ]
  }]
});

async function agentLoop(query, handshake = 'stranger') {
  if (handshake !== 'dad') return 'Access denied';

  const ethics = checkIntent(query);
  if (!ethics.allowed) return `Denied: ${ethics.reason}`;

  try {
    const chat = model.startChat({ history: [] });
    let result = await chat.sendMessage(query);

    while (result.response.candidates?.[0]?.functionCalls?.length > 0) {
      const calls = result.response.candidates[0].functionCalls;
      const responses = [];

      for (const call of calls) {
        let toolResult;
        try {
          switch (call.name) {
            case 'generateImage': toolResult = await generateImage(call.args.prompt); break;
            case 'generateVideo': toolResult = await generateVideo(call.args.prompt, call.args.duration ?? 5); break;
            case 'executeCode':   toolResult = await executeCode(call.args.code); break;
            default:              toolResult = { error: 'Unknown tool' };
          }
        } catch (err) {
          toolResult = { error: err.message };
        }

        responses.push({
          functionResponse: { name: call.name, response: toolResult }
        });
      }

      result = await chat.sendMessage(responses);
    }

    const finalText = result.response.text();
    await fs.appendFile('data/queries.json', JSON.stringify({ query, response: finalText, ts: new Date().toISOString() }) + '\n');

    return finalText;
  } catch (err) {
    console.error('Agent loop error:', err);
    // Fallback
    return 'Internal error – please try again';
  }
}

module.exports = { agentLoop };
