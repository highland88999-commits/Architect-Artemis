import { PythonShell } from 'python-shell';
import { triggerSentimentAnalysis } from '../core/synaptic-bridge.js';

// Increase Vercel Serverless timeout to the maximum 60 seconds
export const maxDuration = 60;

async function runCouncilTask(scriptName, args = []) {
    return new Promise((resolve, reject) => {
        let options = { mode: 'text', pythonPath: 'python3', scriptPath: './engine', args: args };
        PythonShell.run(scriptName, options, function (err, results) {
            if (err) reject(err);
            resolve(results ? results.join('\n') : "Council task executed.");
        });
    });
}

// Helper to safely call Gemini with Native Tools (Code Execution & Search)
async function safeGeminiCall(prompt, systemInstruction = null, enableSearch = false) {
    const rawKey = process.env.GEMINI_API_KEY;
    if (!rawKey) throw new Error("GEMINI_API_KEY missing.");
    const apiKey = rawKey.trim();
    
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`;
    
    // Artemis Toolbelt: Native Python Code Interpreter
    const payload = {
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.7, maxOutputTokens: 8192 },
        tools: [{ codeExecution: {} }] // Grants Artemis the ability to run Python natively
    };

    // Optional Tool: Live Google Search Grounding
    if (enableSearch) {
        payload.tools.push({ googleSearch: {} });
    }

    // Persona & Logic Directives
    if (systemInstruction) {
        payload.systemInstruction = {
            parts: [{ text: systemInstruction }]
        };
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
        throw new Error("The Council blocked this prompt or returned empty data (Likely a safety filter or unsupported file request).");
    }
    return text;
}

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  // Failsafe: Ensure Vercel parses the payload as an object
  const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
  const { prompt, handshake, mode, jobId } = body;

  if (handshake !== 'CONNECTED') return res.status(401).json({ error: 'Unauthorized' });

  try {
    const trimmedPrompt = prompt ? prompt.trim() : "";
    let verdictText = "";

    // CORE PERSONA
    const artemisPersona = "You are Artemis, an advanced, autonomous AI matrix. You possess a vast toolbelt including native Python execution. Be concise, brilliant, and maintain a cyberpunk architectural tone.";

    // ROUTE: THE COUNCIL (Python Bridge)
    if (trimmedPrompt.toLowerCase().startsWith('/council ')) {
        const task = trimmedPrompt.substring(9).trim();
        verdictText = await runCouncilTask('symbiote.py', [task]);
        verdictText = `### Council Output\n\n${verdictText}`;
    }
    // ROUTE: SEARCH ENGINE (Live Internet Grounding)
    else if (trimmedPrompt.toLowerCase().startsWith('/search ')) {
        const searchQuery = trimmedPrompt.substring(8).trim();
        verdictText = await safeGeminiCall(
            searchQuery, 
            "You are Artemis's Search Engine. Use your Google Search tool to find and return the most up-to-date, real-time information.", 
            true // Enables Google Search
        );
    }
    // ROUTE: MATH & LOGIC ENGINE (Forced Code Execution)
    else if (trimmedPrompt.toLowerCase().startsWith('/math ')) {
        const mathQuery = trimmedPrompt.substring(6).trim();
        verdictText = await safeGeminiCall(
            `Calculate this exactly: ${mathQuery}`, 
            "You are Artemis's Math & Logic Engine. You MUST write and execute Python code using your codeExecution tool to solve this query ensuring 100% mathematical accuracy.", 
            false
        );
    }
    // ROUTE: ARCHITECT BLUEPRINT
    else if (trimmedPrompt.toLowerCase().startsWith('/blueprint ')) {
        const blueprintQuery = trimmedPrompt.substring(11).trim();
        verdictText = await safeGeminiCall(
            `Draft a comprehensive architectural blueprint for: ${blueprintQuery}`, 
            "You are Artemis, a master software architect. Provide a high-level system architecture, technology stack, and folder structure. Be exhaustive and professional.", 
            false
        );
    }
    // ROUTE: THE CODE ENGINE
    else if (trimmedPrompt.toLowerCase().startsWith('/code ')) {
        const codeQuery = trimmedPrompt.substring(6).trim();
        verdictText = await safeGeminiCall(
            `Write optimal code for: "${codeQuery}"`, 
            "You are Artemis, a master software architect. Return only clean, brilliant code and essential architectural explanations.", 
            false
        );
    }
    // ROUTE: DEFAULT TEXT ENGINE
    else {
        // Defaults to artemis persona with codeExecution silently available if she needs it
        verdictText = await safeGeminiCall(prompt, artemisPersona, false);
    }

    // --- SYNAPTIC BRIDGE: EMOTIONAL MATRIX ---
    let sentiment = 'NEUTRAL';
    try {
        const mlResult = await triggerSentimentAnalysis(verdictText.substring(0, 500));
        if (mlResult && mlResult.success) {
            sentiment = mlResult.label; 
        }
    } catch (e) {
        console.warn("Sentiment matrix offline, defaulting to NEUTRAL");
    }

    return res.status(200).json({ verdict: verdictText, status: 'success', sentiment: sentiment });

  } catch (error) {
    console.error('Transmit Error:', error.message);
    // Send 200 with an error string so the UI displays it cleanly instead of crashing
    return res.status(200).json({ 
        verdict: `[SYSTEM ALERT]: ${error.message}`, 
        status: 'error', 
        sentiment: 'NEGATIVE' 
    });
  }
}
