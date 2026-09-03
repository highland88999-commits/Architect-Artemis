// Increase Vercel Serverless timeout to the maximum 60 seconds
export const maxDuration = 60;

export default async function handler(req, res) {
  // CORS Preflight
  if (req.method === 'OPTIONS') return res.status(200).end();

  // HELPER: Native fetch bypasses Google SDK bloat and catches empty/blocked responses
  async function askGemini(prompt, systemInstruction = null) {
      const rawKey = process.env.GEMINI_API_KEY;
      if (!rawKey) throw new Error("GEMINI_API_KEY missing in Vercel.");
      
      // Sanitize the key to prevent trailing newlines from causing 404 URL routing errors
      const apiKey = rawKey.trim();
      
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`;
      
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

      // --- 3D MODEL (.GLB) GENERATION ---
      if (type === '3d') {
          const threeJsPrompt = `Create a single-file HTML document using Three.js that procedurally generates a 3D model of: "${prompt}". 
          Requirements:
          1. Use procedural geometries (boxes, spheres, cylinders, etc.) and materials to construct the object.
          2. Include OrbitControls so the user can rotate it.
          3. Include the THREE.GLTFExporter library from a CDN (https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/exporters/GLTFExporter.js).
          4. Add a highly visible, absolute positioned "DOWNLOAD .GLB" button overlaid on the UI. When clicked, it must instantiate GLTFExporter, parse the main 3D group, and trigger a download of a .glb file.
          Return ONLY the raw HTML code, no markdown fences or intro text.`;
          
          const content = await askGemini(threeJsPrompt);
          return res.status(200).json({ type: '3d', content });
      }

      // --- CODE GENERATION (With Polyglot Decision Engine) ---
      if (type === 'code') {
          const polyglotEngine = `You are Artemis, a Master Polyglot Developer fluent in ALL programming languages (Rust, Go, C++, Python, Assembly, WebGL, TS, etc.). First, autonomously analyze the prompt and decide which programming language provides the most optimal performance, safety, and scalability for the specific task. State your chosen language as a comment at the top, then output the pristine code. Return ONLY the raw code, no markdown fences.`;
          const content = await askGemini(`Write optimal code for: ${prompt}`, polyglotEngine);
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
    // Return 200 with an error string so the UI can handle it gracefully instead of crashing
    return res.status(200).json({ 
        type: 'code', 
        content: `// [SYSTEM ERROR] Forge Matrix Sync Failed.\n// Reason: ${error.message}` 
    });
  }
}
