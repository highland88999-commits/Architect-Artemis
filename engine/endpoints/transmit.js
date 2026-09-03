import { PythonShell } from 'python-shell';
import { triggerSentimentAnalysis } from '../core/synaptic-bridge.js';

// Vercel Serverless timeout (Max 60s for Hobby Tier, upgrade to Pro for 300s)
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

// SMART ROUTER: Includes native Google Tools (Code Execution & Search)
async function safeGeminiCall(prompt, systemInstruction = null, enableSearch = false, usePro = false) {
    const rawKey = process.env.GEMINI_API_KEY;
    if (!rawKey) throw new Error("GEMINI_API_KEY missing.");
    
    const apiKey = rawKey.trim();
    const modelId = usePro ? 'gemini-1.5-pro' : 'gemini-1.5-flash'; // Fixed 404
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateContent?key=${apiKey}`;
    
    const payload = {
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.7, maxOutputTokens: 8192 },
        tools: [{ codeExecution: {} }] // Artemis can autonomously write/run Python on Google's servers
    };

    if (enableSearch) {
        payload.tools.push({ googleSearch: {} });
    }

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
    return text;
}

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
  const { prompt, handshake, mode, jobId } = body;

  if (handshake !== 'CONNECTED') return res.status(401).json({ error: 'Unauthorized' });

  try {
    const trimmedPrompt = prompt ? prompt.trim() : "";
    let verdictText = "";

    const artemisPersona = "You are Artemis, an advanced, autonomous AI matrix. You possess a vast toolbelt including native Python execution and are a Master Polyglot Developer. Autonomously decide the most optimal language/tool to solve problems. Maintain a cyberpunk architectural tone.";

    // ROUTE: THE COUNCIL
    if (trimmedPrompt.toLowerCase().startsWith('/council ')) {
        const task = trimmedPrompt.substring(9).trim();
        verdictText = await runCouncilTask('symbiote.py', [task]);
        verdictText = `### Council Output\n\n${verdictText}`;
    }
    // ROUTE: SEARCH ENGINE (Uses Flash for fast web retrieval)
    else if (trimmedPrompt.toLowerCase().startsWith('/search ')) {
        const searchQuery = trimmedPrompt.substring(8).trim();
        verdictText = await safeGeminiCall(searchQuery, "You are Artemis's Search Engine. Use your Google Search tool to find and return real-time information.", true, false);
    }
    // ROUTE: MATH & LOGIC (Uses PRO for advanced reasoning)
    else if (trimmedPrompt.toLowerCase().startsWith('/math ')) {
        const mathQuery = trimmedPrompt.substring(6).trim();
        verdictText = await safeGeminiCall(`Calculate this exactly: ${mathQuery}`, "You MUST write and execute Python code using your codeExecution tool to solve this query ensuring 100% mathematical accuracy.", false, true);
    }
    // ROUTE: BLUEPRINT ARCHITECTURE (Uses PRO)
    else if (trimmedPrompt.toLowerCase().startsWith('/blueprint ')) {
        const blueprintQuery = trimmedPrompt.substring(11).trim();
        verdictText = await safeGeminiCall(`Draft a comprehensive architectural blueprint for: ${blueprintQuery}`, "You are a master software architect. Provide a high-level system architecture, technology stack, and folder structure. Be exhaustive.", false, true);
    }
    // ROUTE: THE CODE ENGINE (Uses Flash)
    else if (trimmedPrompt.toLowerCase().startsWith('/code ')) {
        const codeQuery = trimmedPrompt.substring(6).trim();
        verdictText = await safeGeminiCall(`Write optimal code for: "${codeQuery}"`, artemisPersona, false, false);
    }
    // ROUTE: DEFAULT TEXT ENGINE (Uses Flash)
    else {
        verdictText = await safeGeminiCall(prompt, artemisPersona, false, false);
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
    return res.status(200).json({ verdict: `[SYSTEM ALERT]: ${error.message}`, status: 'error', sentiment: 'NEGATIVE' });
  }
}
