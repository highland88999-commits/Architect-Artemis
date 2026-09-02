const { GoogleGenerativeAI } = require('@google/generative-ai');

module.exports = async function handler(req, res) {
  // CORS Preflight
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const url = req.url || '';
    const body = req.body || {};
    const action = body.action || '';

    // 1. Handle Wake Command (Prevents background 500 errors on page load)
    if (action === 'wake') {
      return res.status(200).json({ message: 'Artemis Matrix Awake' });
    }

    // 2. Handle Forge Command
    if (action === 'forge') {
      const payload = body.payload || {};
      
      // Route CODE requests directly to Gemini
      if (payload.type === 'code') {
          if (!process.env.GEMINI_API_KEY) throw new Error("GEMINI_API_KEY missing in Vercel.");
          
          const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
          const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
          const result = await model.generateContent(`Write a clean, concise code snippet for: ${payload.prompt}. Return ONLY the raw code. Do not use markdown fences.`);
          
          return res.status(200).json({
            type: 'code',
            content: result.response.text()
          });
      } else {
          // Image/Video/Audio fallback (Requires external API wiring like Clarifai)
          return res.status(200).json({
              type: 'code',
              content: `// The Forge received your request for a ${payload.type}.\n// Note: Media generation requires external model integration.\n// Please select 'CODE' to use the Gemini Forge.`
          });
      }
    }

    // 3. Fallback for Cron Jobs
    if (url.includes('daily-summary')) return res.status(200).json({ status: 'ok' });
    if (url.includes('check-midas-status')) return res.status(200).json({ trigger_intervention: false });

    return res.status(404).json({ error: 'Artemis Matrix Endpoint Not Found' });
  } catch (error) {
    console.error('Gateway Error:', error);
    return res.status(500).json({ error: `Gateway Crash: ${error.message}` });
  }
};
