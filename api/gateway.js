import { GoogleGenerativeAI } from '@google/generative-ai';

export default async function handler(req, res) {
  // CORS Preflight
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const url = req.url || '';
    // Failsafe: Ensure Vercel parses the payload as an object, not a raw string
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
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
          
          return res.status(200).json({ type: 'code', content: result.response.text() });
      }

      // --- AUDIO GENERATION (Procedural Web Audio API) ---
      if (type === 'audio') {
          if (!process.env.GEMINI_API_KEY) throw new Error("GEMINI_API_KEY missing.");
          const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
          const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
          
          const audioPrompt = `Create a single-file HTML document with a procedural Web Audio API synthesizer that plays generative ambient frequencies, synthwave drones, or binaural pulses matching this vibe: "${prompt}". Include a cyberpunk UI with Start/Stop buttons and visual frequency feedback. Return ONLY the raw HTML code, no markdown fences or intro text.`;
          
          const result = await model.generateContent(audioPrompt);
          
          return res.status(200).json({ type: 'code', content: result.response.text() });
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
}
