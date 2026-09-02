// Increase Vercel Serverless timeout to the maximum 60 seconds
export const maxDuration = 60;

export default async function handler(req, res) {
  // CORS Preflight
  if (req.method === 'OPTIONS') return res.status(200).end();

  // HELPER: Native fetch bypasses Google SDK bloat and catches empty/blocked responses
  async function askGemini(prompt) {
      const rawKey = process.env.GEMINI_API_KEY;
      if (!rawKey) throw new Error("GEMINI_API_KEY missing in Vercel.");
      
      // Sanitize the key to prevent trailing newlines from causing 404 URL routing errors
      const apiKey = rawKey.trim();
      
      // Upgraded to -latest to prevent 404 Model Not Found errors on restricted API tiers
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`;
      
      const response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
              contents: [{ role: "user", parts: [{ text: prompt }] }],
              generationConfig: { temperature: 0.7, maxOutputTokens: 8192 }
          })
      });

      if (!response.ok) {
          const errText = await response.text();
          throw new Error(`Google API (Status ${response.status}): ${errText}`);
      }

      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      
      if (!text) {
          throw new Error("Gemini safety filters blocked this prompt (Binary file requests like .glb or .obj are not supported by text models).");
      }
      
      // Force-strip markdown formatting so the code deploys perfectly to the Sandbox
      return text.replace(/^```[a-z]*\n?/i, '').replace(/```$/i, '').trim();
  }

  try {
    const url = req.url || '';
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    const action = body.action || '';

    // 1. WAKE COMMAND
    if (action === 'wake') return res.status(200).json({ message: 'Artemis Matrix Awake' });

    // 2. THE FORGE
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
    console.error('Gateway Error:', error.message);
    return res.status(200).json({ 
        type: 'code', 
        content: `// [SYSTEM ERROR] Forge Matrix Sync Failed.\n// Reason: ${error.message}` 
    });
  }
}
