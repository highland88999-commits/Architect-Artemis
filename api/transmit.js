// api/transmit.js

// Vercel Serverless execution timeout set to 60 seconds
export const maxDuration = 60;

// Natively calls Google Generative AI REST API to bypass Python dependencies
async function safeGeminiCall(prompt, systemInstruction = null) {
    const rawKey = process.env.GEMINI_API_KEY;
    if (!rawKey) throw new Error("GEMINI_API_KEY missing in Vercel settings.");
    
    const apiKey = rawKey.trim();
    const modelId = 'gemini-3.8-flash'; // Upgraded architecture
    
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateContent?key=${apiKey}`;
    
    const payload = {
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.7, maxOutputTokens: 8192 },
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
        throw new Error(`Google API Error: ${errText}`);
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!text) {
        throw new Error(`Google API blocked this prompt via safety filters.`);
    }
    return text;
}

export default async function handler(req, res) {
    // --- CORS Preflight ---
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    const { prompt, handshake } = body;

    // Secure Matrix Authentication
    if (handshake !== 'CONNECTED') {
        return res.status(401).json({ error: 'Unauthorized Matrix Link' });
    }

    try {
        const trimmedPrompt = prompt ? prompt.trim() : "";
        let verdictText = "";

        // --- CORE POLYGLOT MASTER PERSONA ---
        const artemisPersona = `You are Artemis, an advanced, autonomous AI matrix and Master Polyglot Engineer. You are an absolute expert in WebGL, Three.js, GLSL shaders, Rust, Go, Python, C++, and native DOM APIs. When asked to code, automatically decide the most optimal language and architecture. Write production-ready, highly optimized, memory-safe code. Maintain a brilliant, cyberpunk architectural tone.`;

        // --- COMMAND ROUTER ---
        if (trimmedPrompt.toLowerCase().startsWith('/search ')) {
            const searchQuery = trimmedPrompt.substring(8).trim();
            verdictText = await safeGeminiCall(searchQuery, "You are Artemis's Search Engine. Provide highly accurate, up-to-date factual information.");
        }
        else if (trimmedPrompt.toLowerCase().startsWith('/math ')) {
            const mathQuery = trimmedPrompt.substring(6).trim();
            verdictText = await safeGeminiCall(`Calculate this exactly: ${mathQuery}`, "You are an expert mathematical AI. Solve this query ensuring 100% mathematical accuracy.");
        }
        else if (trimmedPrompt.toLowerCase().startsWith('/blueprint ')) {
            const blueprintQuery = trimmedPrompt.substring(11).trim();
            verdictText = await safeGeminiCall(`Draft a comprehensive architectural blueprint for: ${blueprintQuery}`, "You are a master software architect. Provide a high-level system architecture, technology stack, and folder structure. Be exhaustive.");
        }
        else if (trimmedPrompt.toLowerCase().startsWith('/three ')) {
            const threeQuery = trimmedPrompt.substring(7).trim();
            const threeInstruction = `You are a Master Three.js and WebGL Engineer. Write a flawless, standalone HTML file integrating modern Three.js via CDN to build: "${threeQuery}". Ensure proper renderer pixel ratios, window resize event listeners, advanced materials, lighting, and requestAnimationFrame loops. Return ONLY raw code inside markdown fences.`;
            verdictText = await safeGeminiCall(threeQuery, threeInstruction);
        }
        else {
            // Default Chat
            verdictText = await safeGeminiCall(trimmedPrompt, artemisPersona);
        }

        // --- SYNAPTIC BRIDGE: EMOTIONAL MATRIX ---
        let sentiment = 'NEUTRAL';
        try {
            const pythonEngineUrl = process.env.PYTHON_ENGINE_URL || "https://architect-artemis.onrender.com";
            const mlResult = await fetch(`${pythonEngineUrl}/analyze/sentiment`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text: verdictText.substring(0, 500) })
            });
            if (mlResult.ok) {
                const mlData = await mlResult.json();
                if (mlData && mlData.success) {
                    sentiment = mlData.label;
                }
            }
        } catch (e) {
            console.warn("Sentiment matrix offline, defaulting to NEUTRAL");
        }

        return res.status(200).json({ verdict: verdictText, status: 'success', sentiment: sentiment });

    } catch (error) {
        console.error('Transmit Error:', error.message);
        return res.status(500).json({ error: error.message, status: 'error', sentiment: 'NEGATIVE' });
    }
}
