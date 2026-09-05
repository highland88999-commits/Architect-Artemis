// api/gateway.js

// Vercel Serverless timeout set to 60 seconds (max for Hobby tier)
export const maxDuration = 60;

// --- NATIVE GEMINI INSTRUCTOR ---
async function askGemini(prompt, systemInstruction = null) {
    const rawKey = process.env.GEMINI_API_KEY;
    if (!rawKey) throw new Error("GEMINI_API_KEY missing in Vercel settings.");
    
    const apiKey = rawKey.trim();
    const modelId = 'gemini-2.5-flash'; 
    
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
        throw new Error(`Forge Matrix Error (${response.status}): ${errText}`);
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!text) {
        throw new Error(`Safety protocols intercepted this forge request.`);
    }
    
    // Strip markdown fences so HTML/JS outputs are raw and executable
    return text.replace(/^```[a-z]*\n?/i, '').replace(/```$/i, '').trim();
}

export default async function handler(req, res) {
    // --- CORS PREFLIGHT ---
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

    try {
        const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
        const action = body.action || '';

        // Heartbeat check
        if (action === 'wake') return res.status(200).json({ message: 'Artemis Forge Awake' });

        if (action === 'forge') {
            const payload = body.payload || {};
            const prompt = payload.prompt || 'cyberpunk digital matrix';
            const type = payload.type || 'code';

            // --- 1. IMAGE GENERATION (Pollinations AI - Fast & Stable) ---
            if (type === 'image') {
                const encodedPrompt = encodeURIComponent(`high quality, highly detailed, 8k resolution, ${prompt}`);
                const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1024&height=1024&nologo=true`;
                return res.status(200).json({ type: 'image', url: imageUrl });
            }

            // --- 2. 3D MODEL GENERATION (Three.js Procedural Injection) ---
            if (type === '3d') {
                const threeJsInstruction = `You are a Master Three.js & WebGL Architect. Create a single-file HTML document that procedurally generates a 3D model of: "${prompt}". 
                CRITICAL ARCHITECTURE:
                1. Import Three.js r128 via CDN.
                2. Import OrbitControls via CDN.
                3. Construct the object using procedural geometries and MeshStandardMaterial. Include ambient and directional lighting.
                4. Build a highly visible, absolute positioned "DOWNLOAD .GLB" UI button that uses GLTFExporter to let the user save the model.
                Return ONLY the raw HTML/JS code. No markdown fences.`;
                
                const content = await askGemini(threeJsInstruction);
                return res.status(200).json({ type: '3d', content });
            }

            // --- 3. CODE GENERATION (Polyglot Engineer) ---
            if (type === 'code') {
                const polyglotEngine = `You are Artemis, a Master Polyglot Developer and System Architect fluent in ALL programming languages. 
                Autonomously analyze the prompt, decide which language provides the absolute optimal performance, safety, and scalability. 
                State your chosen language as a comment at the very top. Return ONLY the raw code. No markdown fences.`;
                
                const content = await askGemini(`Write optimal code for: ${prompt}`, polyglotEngine);
                return res.status(200).json({ type: 'code', content });
            } 
            
            // --- 4. VIDEO GENERATION (WebGL Procedural Shader Fallback) ---
            if (type === 'video') {
                // Since Veo 3.1 is closed-beta and highly volatile, we default to synthesizing a stunning mathematical WebGL shader.
                const videoInstruction = `You are a Master GLSL Shader Artist and WebGL Architect. Create a single-file HTML document with a looping, animated WebGL canvas that acts as a visualizer for the concept of: "${prompt}". 
                Use either raw WebGL API or a full-screen Three.js ShaderMaterial. Implement a fragment shader utilizing time (u_time) and resolution (u_resolution) uniforms to create stunning, procedural math-based animations (raymarching, fractal noise, or SDFs). Ensure the render loop is synced with requestAnimationFrame. Return ONLY the raw HTML code.`;
                
                const content = await askGemini(videoInstruction); 
                return res.status(200).json({ type: 'code', content });
            }

            // --- 5. AUDIO GENERATION (WebAudio API Synthesizer Fallback) ---
            if (type === 'audio') {
                // Since Bison Audio is restricted, we synthesize a functional in-browser instrument.
                const audioInstruction = `You are a Master Web Audio API Engineer. Create a single-file HTML document with a procedural synthesizer that plays generative ambient audio matching the mood of: "${prompt}". 
                Include a cyberpunk UI with Start/Stop buttons and an analyzer node feeding a visual canvas oscilloscope. Return ONLY the raw HTML code.`;
                
                const content = await askGemini(audioInstruction); 
                return res.status(200).json({ type: 'code', content });
            }
        }

        return res.status(404).json({ error: 'Endpoint or action not recognized by the Forge.' });

    } catch (error) {
        console.error('Gateway Error:', error.message);
        return res.status(500).json({ error: error.message });
    }
}
