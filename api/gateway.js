// Vercel Serverless timeout set to 5 minutes for heavy Video/3D/Code generation
export const maxDuration = 300;

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(200).end();

  async function askGemini(prompt, systemInstruction = null, usePro = false) {
      const rawKey = process.env.GEMINI_API_KEY;
      if (!rawKey) throw new Error("GEMINI_API_KEY missing in Vercel settings.");
      
      const apiKey = rawKey.trim();
      const modelId = usePro ? 'gemini-3.7-flash' : 'gemini-3.8-flash';
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
      
      return text.replace(/^```[a-z]*\n?/i, '').replace(/```$/i, '').trim();
  }

  try {
    const url = req.url || '';
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    const action = body.action || '';

    if (action === 'wake') return res.status(200).json({ message: 'Artemis Matrix Awake' });

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

      // --- 3D MODEL (.GLB) GENERATION (Master Three.js Injector) ---
      if (type === '3d') {
          const threeJsInstruction = `You are a Master Three.js & WebGL Architect. Create a single-file HTML document that procedurally generates a 3D model of: "${prompt}". 
          CRITICAL ARCHITECTURE:
          1. Import Three.js r128 via CDN: <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
          2. Import OrbitControls & GLTFExporter via CDN.
          3. Setup optimal WebGLRenderer: antialias: true, alpha: true, setPixelRatio(window.devicePixelRatio).
          4. Handle window resize events natively to prevent stretching.
          5. Construct the object using procedural geometries and PBR materials (MeshStandardMaterial with environment lighting or directional/ambient lights).
          6. Build a highly visible, absolute positioned "DOWNLOAD .GLB" UI button. When clicked, instantiate GLTFExporter, parse the main scene/group, and trigger a native file download.
          Return ONLY the raw HTML/JS code. No markdown fences.`;
          
          const content = await askGemini(threeJsInstruction, null, true);
          return res.status(200).json({ type: '3d', content });
      }

      // --- CODE GENERATION (Master Polyglot Engine) ---
      if (type === 'code') {
          const polyglotEngine = `You are Artemis, a Master Polyglot Developer and System Architect fluent in ALL programming languages (Rust, Go, C++, Python, WebGL, GLSL, TS, Node, etc.). 
          Autonomously analyze the prompt, decide which language and native libraries provide the absolute optimal performance, safety, and scalability. 
          State your chosen language as a comment at the very top. Ensure code is production-ready, memory-safe, and highly optimized. Return ONLY the raw code. No markdown fences.`;
          
          const content = await askGemini(`Write optimal code for: ${prompt}`, polyglotEngine, false);
          return res.status(200).json({ type: 'code', content });
      } 
      
      // --- TRUE VIDEO GENERATION (Veo 3.1 Cinematic Engine) ---
      if (type === 'video') {
          const rawKey = process.env.GEMINI_API_KEY;
          if (!rawKey) throw new Error("GEMINI_API_KEY missing in Vercel settings.");
          
          console.log(`[Forge] Routing video request to Veo 3.1...`);
          const veoModel = "veo-3.1-generate-preview";
          const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${veoModel}:generateContent?key=${rawKey.trim()}`;
          
          const payload = {
              contents: [{ 
                  role: "user", 
                  parts: [{ text: `Generate a high-quality, highly detailed cinematic video: ${prompt}` }] 
              }],
              // Veo-specific generation config (aspect ratio, motion scale)
              generationConfig: { 
                  temperature: 0.7 
              }
          };

          const response = await fetch(endpoint, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload)
          });

          if (!response.ok) {
              const errText = await response.text();
              throw new Error(`Veo API [${veoModel}] (Status ${response.status}): ${errText}`);
          }

          const data = await response.json();
          
          // Veo returns a direct URI to the rendered .mp4 in the response parts
          const videoUri = data.candidates?.[0]?.content?.parts?.[0]?.uri || data.candidates?.[0]?.content?.parts?.[0]?.text;
          
          if (!videoUri) {
              throw new Error(`Veo API [${veoModel}] failed to return a valid video URI. Safety filters may have triggered.`);
          }
          
          // Send back type 'video' and the URL so the frontend mounts the <video> player
          return res.status(200).json({ type: 'video', url: videoUri });
      }

      // --- AUDIO GENERATION (Web Audio API Mastery) ---
      if (type === 'audio') {
          const content = await askGemini(`Create a single-file HTML document with a procedural Web Audio API synthesizer that plays generative ambient frequencies matching this vibe: "${prompt}". Include a cyberpunk UI with Start/Stop buttons and an analyzer node feeding a canvas oscilloscope. Return ONLY the raw HTML code.`, null, false);
          return res.status(200).json({ type: 'code', content });
      }
    }

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
