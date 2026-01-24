const { GoogleGenerativeAI } = require('@google/generative-ai');
const { pool } = require('./atlas-db'); 
const { getSelfAwareness } = require('./consciousness');
const { generateImage, generateVideo } = require('../tools/media');
require('dotenv').config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });

async function agentLoop(query, handshake = 'stranger') {
  const self = await getSelfAwareness();
  const isArchitect = (handshake === process.env.HANDSHAKE);

  // Persona Assignment
  const systemNote = isArchitect 
    ? "MODE: ARCHITECT. Full access. Current CNS: " + self.status
    : "MODE: COUNCIL. Helpful, mysterious guest assistant. CNS: " + self.status;

  try {
    const chat = model.startChat({ history: [] });
    const result = await chat.sendMessage(`${systemNote}\n\nTask: ${query}`);
    const finalText = result.response.text();

    // Prepare response for Frontend
    const responseData = {
        verdict: finalText,
        files: []
    };

    // Extract any generated media URLs for the Download Button
    const mediaUrls = finalText.match(/https?:\/\/[^\s]+?\.(jpg|png|gif|mp4)/gi);
    if (mediaUrls) responseData.files = mediaUrls;

    // Log to DB
    await pool.query(
      `INSERT INTO web_map (url, optimization_summary, status) VALUES ($1, $2, $3)
       ON CONFLICT (url) DO NOTHING`,
      ['internal', finalText.slice(0, 100), 'processed']
    );

    return responseData;
  } catch (err) {
    console.error('Agent error:', err);
    return { verdict: 'Core oscillation error.', files: [] };
  }
}

module.exports = { agentLoop };
