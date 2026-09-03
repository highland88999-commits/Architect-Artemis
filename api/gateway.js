// Vercel Serverless timeout (Max 60s for Hobby Tier, upgrade to Pro for 300s)
export const maxDuration = 60;

export default async function handler(req, res) {
  // CORS Preflight
  if (req.method === 'OPTIONS') return res.status(200).end();

  // SMART ROUTER: Dynamically switches between Flash (Speed) and Pro (Deep Logic)
  async function askGemini(prompt, systemInstruction = null, usePro = false) {
      const rawKey = process.env.GEMINI_API_KEY;
      if (!rawKey) throw new Error("GEMINI_API_KEY missing in Vercel settings.");
      
      const apiKey = rawKey.trim();
      const modelId = usePro ? 'gemini-1.5-pro' : 'gemini-1.5-flash'; // Removed -latest to fix 404
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateContent?key=${apiKey}`;
      
      const payload = {
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.7, maxOutputTokens: 8192 }
      };

      if (systemInstruction) {
          payload.systemInstruction = { parts: [{ text: systemInstruction }] };
      }
      
      const response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
      });

      if (!response.ok) {
          const errText = await response.text();
          throw new Error(`Google API [${modelId}] (Status ${response.status}): ${errText}`);
      }

      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      
      if (!text) {
          throw new Error(`Google API [${modelId}] blocked this prompt via safety filters.`);
      }
      
      // Force-strip markdown formatting for clean Sandbox injection
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

      // --- IMAGE GENERATION (Pollinations.ai - Free, No Key) ---
      if (type === 'image') {
          const encodedPrompt = encodeURIComponent(`high quality, highly detailed, 8k resolution, ${prompt}`);
          const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1024&height=1024&nologo=true`;
          return res.status(200).json({ type: 'image', url: imageUrl });
      }

      // --- 3D MODEL (.GLB) GENERATION (Routed to Gemini 1.5 PRO) ---
      if (type === '3d') {
          const threeJsPrompt = `Create a single-file HTML document using Three.js that procedurally generates a 3D model of: "${prompt}". 
          Requirements:
          1. Use procedural geometries (boxes, spheres, cylinders) to construct the object.
          2. Include OrbitControls.
          3. Include the THREE.GLTFExporter library from CDN (https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/exporters/GLTFExporter.js).
          4. Add a massive, absolute positioned "DOWNLOAD .GLB" button overlaid on the UI that parses the scene and triggers a file download.
          Return ONLY the raw HTML code, no markdown.`;
          
          // Using PRO because 3D spatial math requires higher reasoning
          const content = await askGemini(threeJsPrompt, null, true);
          return res.status(200).json({ type: '3d', content });
      }

      // --- CODE GENERATION (With Polyglot Decision Engine - Routed to Gemini Flash) ---
      if (type === 'code') {
          const polyglotEngine = `You are Artemis, a Master Polyglot Developer fluent in ALL programming languages (Rust, Go, C++, Python, WebGL, TS, etc.). Autonomously analyze the prompt, decide which language provides the optimal performance/scalability for the task, state your chosen language as a top comment, and output pristine code. Return ONLY the raw code, no markdown.`;
          const content = await askGemini(`Write optimal code for: ${prompt}`, polyglotEngine, false);
          return res.status(200).json({ type: 'code', content });
      } 
      
      // --- VIDEO GENERATION (Procedural HTML Canvas) ---
      if (type === 'video') {
          const content = await askGemini(`Create a single-file HTML document with a looping, animated CSS or WebGL canvas that acts as a visualizer for the concept: "${prompt}". Return ONLY the raw HTML code, no markdown.`, null, false);
          return res.status(200).json({ type: 'code', content });
      }

      // --- AUDIO GENERATION (Procedural Web Audio API) ---
      if (type === 'audio') {
          const content = await askGemini(`Create a single-file HTML document with a procedural Web Audio API synthesizer that plays generative ambient frequencies matching this vibe: "${prompt}". Include a cyberpunk UI with Start/Stop buttons. Return ONLY the raw HTML code, no markdown.`, null, false);
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
