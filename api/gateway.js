const { GoogleGenerativeAI } = require('@google/generative-ai');

module.exports = async function handler(req, res) {
  // CORS Preflight
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const url = req.url || '';
    const body = req.body || {};
    const action = body.action || '';

    // 1. WAKE COMMAND
    if (action === 'wake') {
      return res.status(200).json({ message: 'Artemis Matrix Awake' });
    }

    // 2. THE FORGE (Media & Code Generation)
    if (action === 'forge') {
      const payload = body.payload || {};
      const prompt = payload.prompt || 'cyberpunk digital matrix';
      const type = payload.type || 'code';

      // --- CODE GENERATION ---
      if (type === 'code') {
          if (!process.env.GEMINI_API_KEY) throw new Error("GEMINI_API_KEY missing.");
          const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
          const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
          const result = await model.generateContent(`Write a clean, concise code snippet for: ${prompt}. Return ONLY the raw code. Do not use markdown fences or explanations.`);
          
          return res.status(200).json({ type: 'code', content: result.response.text() });
      } 
      
      // --- IMAGE GENERATION (Via Open-Source AI) ---
      if (type === 'image') {
          // Pollinations is free and requires no API key. We append style tags to match her aesthetic.
          const enhancedPrompt = `high quality, highly detailed, 8k resolution, ${prompt}`;
          const encodedPrompt = encodeURIComponent(enhancedPrompt);
          const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1024&height=1024&nologo=true`;
          
          return res.status(200).json({ type: 'image', url: imageUrl });
      }

      // --- VIDEO GENERATION (Simulated via WebGL/CSS Animation) ---
      if (type === 'video') {
          if (!process.env.GEMINI_API_KEY) throw new Error("GEMINI_API_KEY missing.");
          const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
          const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
          const result = await model.generateContent(`Create a single-file HTML document with a looping, animated CSS or WebGL canvas that acts as a visualizer for the concept: "${prompt}". Return ONLY the raw HTML code, no markdown fences or intro text.`);
          
          // Returns animated HTML code that the user can deploy to the Sandbox
          return res.status(200).json({ type: 'code', content: result.response.text() });
      }

      // --- AUDIO GENERATION (Placeholder) ---
      if (type === 'audio') {
           return res.status(200).json({
              type: 'code',
              content: `// The Forge received an Audio request for: "${prompt}".\n// Integrating Tone.js or an external audio API is required for raw .wav/.mp3 synthesis.\n// Please use the Python Matrix for audio wave generation.`
          });
      }
    }

    // 3. CRON JOB FALLBACKS
    if (url.includes('daily-summary')) return res.status(200).json({ status: 'ok' });
    if (url.includes('check-midas-status')) return res.status(200).json({ trigger_intervention: false });

    return res.status(404).json({ error: 'Endpoint Not Found' });
  } catch (error) {
    console.error('Gateway Error:', error);
    return res.status(500).json({ error: `Gateway Crash: ${error.message}` });
  }
};
