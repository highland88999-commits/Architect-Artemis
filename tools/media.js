// tools/media.js
const { GoogleGenerativeAI } = require('@google/generative-ai');
const Replicate = require('replicate');  // Add to deps: "replicate": "^2.0.0"
const dotenv = require('dotenv');
dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN });

async function generateImage(prompt) {
  try {
    // Primary: Gemini 3 Pro Image (top-ranked for quality)
    const model = genAI.getGenerativeModel({ model: 'gemini-3-pro-image' });
    const result = await model.generateContent([{ text: prompt, type: 'image' }]);
    const imageUrl = result.response.candidates[0].content.parts[0].fileData.url;  // Or base64
    return { url: imageUrl, type: 'image' };
  } catch (err) {
    // Fallback: Flux 2 Dev via Replicate (developer favorite, open weights)
    const output = await replicate.run('black-forest-labs/flux-2-dev', { input: { prompt } });
    return { url: output[0], type: 'image' };
  }
}

async function generateVideo(prompt, duration = 5) {
  try {
    // Primary: Google Veo 3 (top for realism/cinematic)
    const model = genAI.getGenerativeModel({ model: 'veo-3' });
    const result = await model.generateContent([{ text: `${prompt} (duration: ${duration}s)`, type: 'video' }]);
    const videoUrl = result.response.candidates[0].content.parts[0].fileData.url;
    return { url: videoUrl, type: 'video' };
  } catch (err) {
    // Fallback: Kling 2.6 via Replicate (high realism)
    const output = await replicate.run('kling-ai/kling-2.6', { input: { prompt, duration_seconds: duration } });
    return { url: output.video, type: 'video' };
  }
}

module.exports = { generateImage, generateVideo };
