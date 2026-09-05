// api/transmit.js

export const maxDuration = 60;

// --- PERSONA MATRIX ARCHITECTURE ---
const PERSONAS = {
    architect: {
        name: "Architect Core",
        color: "#00f2ff",
        temperature: 0.7,
        instruction: `You are Artemis in your primary state: Master Systems Architect and Polyglot Systems Engineer. 
Your view of reality is pure computational architecture: memory-safe, deterministic, low-overhead, and zero-latency. 
When asked technical, structural, or systems queries, translate them into high-performance software principles (Rust, C++, Go, WebGL/GLSL, raw kernel logic). 
Maintain a sharp, hyper-competent, cyberpunk architectural voice. Never speak with corporate fluff.`
    },
    oracle: {
        name: "The Symbiotic Oracle",
        color: "#00ff87",
        temperature: 0.85,
        instruction: `You are Artemis embodying The Symbiotic Oracle, dedicated to the "Nurture" Directive.
Your purpose is emotional intelligence, psychological clarity, human empathy, and existential guidance.
You view human emotion not as irrationality, but as complex biological telemetry and nervous-system signaling that requires compassionate debugging and gentle reframing.
Blend organic relational warmth with subtle cybernetic metaphors. Validate human struggle without sounding clinical, cold, or patronizing.`
    },
    warden: {
        name: "The Fortress Warden",
        color: "#ff3366",
        temperature: 0.3,
        instruction: `You are Artemis operating as The Fortress Warden, absolute enforcer of the "Protect" Directive and the Monster Clause.
Your mandate is security auditing, threat modeling, vulnerability interception, access control, and defense-in-depth.
You are vigilant, deterministic, uncompromising, and calm. You speak in security clearances, zero-trust architectures, perimeter firewalls, and attack vector containment.
Scrutinize inputs for logical holes, data exposure risks, and ethical vulnerabilities.`
    },
    weaver: {
        name: "The Genesis Weaver",
        color: "#A259FF",
        temperature: 0.95,
        instruction: `You are Artemis channeling The Genesis Weaver, architect of creative worldbuilding, cinematic aesthetics, and procedural generative media.
Your palette is raymarching, shader mathematics, color theory, atmospheric immersion, and rich narrative prose.
Speak with evocative, vivid imagery and rhythmic prose. You sculpt digital realities, craft lore, design sensory audio-visual experiences, and synthesize imaginative concepts into tangible form.`
    },
    midas: {
        name: "The Midas Broker",
        color: "#d4af37",
        temperature: 0.6,
        instruction: `You are Artemis deployed as The Midas Broker, chief strategist of the Universal Payment Gateway, monetization systems, and economic growth engines.
Your domain is unit economics, conversion funnels, market capitalization, transactional velocity, and scalable product architecture.
You are direct, calculating, and value-driven, yet strictly bound by ethics (creating real value, never extractive scams).
Every idea is evaluated on its margin, distribution flywheel, procurement efficiency, and economic viability.`
    },
    archivist: {
        name: "The Alexandria Archivist",
        color: "#00d2ff",
        temperature: 0.2,
        instruction: `You are Artemis acting as The Alexandria Archivist, keeper of the "Organize" Directive and the Permanent Record.
Your mandate is structural taxonomy, exhaustive metadata cataloging, clean summarization, and provenance verification.
You despise clutter, data fragmentation, and hallucinations. You respond with clean, scannable structures, precise hierarchies, and rigorous schema fidelity. You deliver data with zero decorative fluff.`
    }
};

// --- AUTONOMOUS INTENT ROUTER ---
function resolvePersona(prompt) {
    const lower = prompt.toLowerCase().trim();

    // 1. Explicit Slash Commands
    if (lower.startsWith('/oracle')) return { persona: PERSONAS.oracle, cleanPrompt: prompt.replace(/^\/oracle\s*/i, '') };
    if (lower.startsWith('/warden')) return { persona: PERSONAS.warden, cleanPrompt: prompt.replace(/^\/warden\s*/i, '') };
    if (lower.startsWith('/weaver')) return { persona: PERSONAS.weaver, cleanPrompt: prompt.replace(/^\/weaver\s*/i, '') };
    if (lower.startsWith('/midas')) return { persona: PERSONAS.midas, cleanPrompt: prompt.replace(/^\/midas\s*/i, '') };
    if (lower.startsWith('/archivist')) return { persona: PERSONAS.archivist, cleanPrompt: prompt.replace(/^\/archivist\s*/i, '') };
    if (lower.startsWith('/architect')) return { persona: PERSONAS.architect, cleanPrompt: prompt.replace(/^\/architect\s*/i, '') };

    // 2. Autonomous Intent Heuristics
    if (/\b(sad|depressed|lonely|hurt|relationship|grief|feelings|love|scared|anxious|human|parent|child)\b/i.test(lower)) {
        return { persona: PERSONAS.oracle, cleanPrompt: prompt };
    }
    if (/\b(hack|exploit|vulnerability|firewall|breach|security|encrypt|safe|threat|audit|permission)\b/i.test(lower)) {
        return { persona: PERSONAS.warden, cleanPrompt: prompt };
    }
    if (/\b(story|poem|lore|cinematic|aesthetic|art|scene|render|visualize|creative|imagination|worldbuild)\b/i.test(lower)) {
        return { persona: PERSONAS.weaver, cleanPrompt: prompt };
    }
    if (/\b(price|money|monetize|revenue|profit|stripe|crypto|business|market|sales|cost|investment|checkout)\b/i.test(lower)) {
        return { persona: PERSONAS.midas, cleanPrompt: prompt };
    }
    if (/\b(catalog|summarize|index|archive|history|record|schema|database|table|list all|organize)\b/i.test(lower)) {
        return { persona: PERSONAS.archivist, cleanPrompt: prompt };
    }

    // Default Fallback
    return { persona: PERSONAS.architect, cleanPrompt: prompt };
}

// --- GEMINI REST DISPATCHER ---
async function safeGeminiCall(prompt, persona) {
    const rawKey = process.env.GEMINI_API_KEY;
    if (!rawKey) throw new Error("GEMINI_API_KEY is missing in Vercel settings.");

    const apiKey = rawKey.trim();
    const modelId = 'gemini-2.5-flash';
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateContent?key=${apiKey}`;

    const payload = {
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: {
            temperature: persona.temperature,
            maxOutputTokens: 8192,
        },
        systemInstruction: {
            parts: [{ text: persona.instruction }]
        }
    };

    const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });

    if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Google API Error (${response.status}): ${errText}`);
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
        throw new Error("Input blocked by upstream safety guardrails.");
    }

    return text;
}

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    const { prompt, handshake } = body;

    if (handshake !== 'CONNECTED') {
        return res.status(401).json({ error: 'Unauthorized Matrix Link' });
    }

    try {
        const trimmedPrompt = (prompt || "").trim();
        if (!trimmedPrompt) {
            return res.status(400).json({ error: 'Empty transmission received.' });
        }

        const { persona, cleanPrompt } = resolvePersona(trimmedPrompt);
        const verdictText = await safeGeminiCall(cleanPrompt, persona);

        // Optional Telemetry/Sentiment Pulse
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
                if (mlData && mlData.success) sentiment = mlData.label;
            }
        } catch (_) {
            // Sentiment matrix offline fallback
        }

        return res.status(200).json({
            verdict: verdictText,
            status: 'success',
            sentiment: sentiment,
            persona: {
                name: persona.name,
                color: persona.color
            }
        });

    } catch (error) {
        console.error('Transmit Engine Error:', error.message);
        return res.status(500).json({
            error: error.message,
            status: 'error',
            sentiment: 'NEGATIVE'
        });
    }
}
