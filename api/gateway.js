// Vercel Serverless timeout set to 5 minutes for heavy Video/3D/Code generation
export const maxDuration = 300;

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(200).end();

  async function askGemini(prompt, systemInstruction = null, usePro = false) {
      const rawKey = process.env.GEMINI_API_KEY;
      if (!rawKey) throw new Error("GEMINI_API_KEY missing in Vercel settings.");
      
      const apiKey = rawKey.trim();
      const modelId = usePro ? 'gemini-3.7-flash' : 'gemini-3.8-flash';
      
      // Standard text generation remains on stable v1beta
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
      
      // --- TRUE VIDEO GENERATION (Veo 3.1 Cinematic Engine with Lite Fallback) ---
      if (type === 'video') {
          const rawKey = process.env.GEMINI_API_KEY;
          if (!rawKey) throw new Error("GEMINI_API_KEY missing in Vercel settings.");
          const apiKey = rawKey.trim();

          // Reusable function to fetch from specific Veo model
          async function generateVeoVideo(modelName) {
              const endpoint = `https://generativelanguage.googleapis.com/v1alpha/models/${modelName}:predict?key=${apiKey}`;
              
              const payload = {
                  instances: [
                      { prompt: `Generate a high-quality, highly detailed cinematic video: ${prompt}` }
                  ],
                  parameters: { 
                      sampleCount: 1,
                      aspectRatio: "16:9"
                  }
              };

              const response = await fetch(endpoint, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(payload)
              });

              if (!response.ok) {
                  const errText = await response.text();
                  throw new Error(`Veo API [${modelName}] (Status ${response.status}): ${errText}`);
              }

              const data = await response.json();
              const videoData = data.predictions?.[0]?.videoUri || data.predictions?.[0]?.bytesBase64 || data.predictions?.[0]?.uri;
              
              if (!videoData) {
                  throw new Error(`Veo API [${modelName}] failed to return a valid video. Safety filters may have triggered.`);
              }
              
              return videoData.startsWith('http') ? videoData : `data:video/mp4;base64,${videoData}`;
          }

          try {
              console.log(`[Forge] Routing video request to primary Veo 3.1...`);
              const finalUrl = await generateVeoVideo("veo-3.1-generate-preview");
              return res.status(200).json({ type: 'video', url: finalUrl });
          } catch (primaryError) {
              console.warn(`[Forge] Primary Veo failed (${primaryError.message}). Falling back to Veo 3.1 Lite...`);
              
              try {
                  const fallbackUrl = await generateVeoVideo("veo-3.1-lite-generate-preview");
                  return res.status(200).json({ type: 'video', url: fallbackUrl });
              } catch (fallbackError) {
                  throw new Error(`Both primary and fallback Veo models failed. Last Error: ${fallbackError.message}`);
              }
          }
      }

      // --- TRUE AUDIO GENERATION (Google Generative Audio / WebAudio Fallback) ---
      if (type === 'audio') {
          const rawKey = process.env.GEMINI_API_KEY;
          if (!rawKey) throw new Error("GEMINI_API_KEY missing in Vercel settings.");
          
          console.log(`[Forge] Routing audio request to Audio Engine...`);
          
          try {
              const audioModel = "music-bison-preview";
              const endpoint = `https://generativelanguage.googleapis.com/v1alpha/models/${audioModel}:predict?key=${rawKey.trim()}`;
              
              const payload = {
                  instances: [{ prompt: `Generate high-fidelity ambient audio: ${prompt}` }],
                  parameters: { durationSeconds: 15 }
              };

              const response = await fetch(endpoint, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(payload)
              });

              if (!response.ok) {
                  const errText = await response.text();
                  throw new Error(`Native Audio Error: ${errText}`);
              }

              const data = await response.json();
              const audioData = data.predictions?.[0]?.audioUri || data.predictions?.[0]?.bytesBase64;
              
              if (!audioData) throw new Error("Empty audio payload.");
              
              const finalUrl = audioData.startsWith('http') ? audioData : `data:audio/mp3;base64,${audioData}`;
              return res.status(200).json({ type: 'audio', url: finalUrl });

          } catch (audioError) {
              console.warn(`[Forge] True Audio API bypassed. Synthesizing WebAudio Code via Gemini 3.7 Flash... Reason: ${audioError.message}`);
              
              // Fallback to high-end code generation if native bytes are restricted
              const audioInstruction = `You are a Master Web Audio API Engineer. Create a single-file HTML document with a procedural synthesizer that plays generative audio matching: "${prompt}". Include a cyberpunk UI with Start/Stop buttons and an analyzer node feeding a canvas oscilloscope. Return ONLY the raw HTML code.`;
              
              const content = await askGemini(audioInstruction, null, true); // usePro = true
              return res.status(200).json({ type: 'code', content });
          }
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
