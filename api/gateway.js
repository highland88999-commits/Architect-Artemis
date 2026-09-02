export default async function handler(req, res) {
  // CORS Preflight
  if (req.method === 'OPTIONS') return res.status(200).end();

  // HELPER: Bypasses the heavy Google SDK to prevent Vercel Serverless crashes
  async function askGemini(prompt) {
      if (!process.env.GEMINI_API_KEY) throw new Error("GEMINI_API_KEY missing in Vercel.");
      
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
              contents: [{ role: "user", parts: [{ text: prompt }] }],
              generationConfig: { temperature: 0.7 }
          })
      });

      if (!response.ok) {
          const errText = await response.text();
          throw new Error(`API Error: ${response.status} - ${errText}`);
      }

      const data = await response.json();
      let text = data.candidates[0].content.parts[0].text;
      
      // Force-strip markdown formatting so the code deploys perfectly to the Sandbox
      text = text.replace(/^```[a-z]*\n?/i, '').replace(/```$/i, '').trim();
      return text;
  }

  try {
    const url = req.url || '';
    // Failsafe: Ensure Vercel parses the payload as an object
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

      // --- IMAGE GENERATION ---
      if (type === 'image') {
          const encodedPrompt = encodeURIComponent(`high quality, highly detailed, 8k resolution, ${prompt}`);
          const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1024&height=1024&nologo=true`;
          
          return res.status(200).json({ type: 'image', url: imageUrl });
      }

      // --- CODE GENERATION ---
      if (type === 'code') {
          const content = await askGemini(`Write a clean, concise code snippet for: ${prompt}. Return ONLY the raw code. Do not use markdown fences or explanations.`);
          return res.status(200).json({ type: 'code', content });
      } 
      
      // --- VIDEO GENERATION ---
      if (type === 'video') {
          const content = await askGemini(`Create a single-file HTML document with a looping, animated CSS or WebGL canvas that acts as a visualizer for the concept: "${prompt}". Return ONLY the raw HTML code, no markdown fences or intro text.`);
          return res.status(200).json({ type: 'code', content });
      }

      // --- AUDIO GENERATION ---
      if (type === 'audio') {
          const content = await askGemini(`Create a single-file HTML document with a procedural Web Audio API synthesizer that plays generative ambient frequencies, synthwave drones, or binaural pulses matching this vibe: "${prompt}". Include a cyberpunk UI with Start/Stop buttons and visual frequency feedback. Return ONLY the raw HTML code, no markdown fences or intro text.`);
          return res.status(200).json({ type: 'code', content });
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
