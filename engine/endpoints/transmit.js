import { GoogleGenerativeAI } from '@google/generative-ai';
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

// Helper to safely call Gemini and prevent 500 crashes on blocked/empty prompts
async function safeGeminiCall(prompt) {
    const apiKey = process.env.GEMINI_API_KEY || process.env.EMERGENT_LLM_KEY;
    if (!apiKey) throw new Error("GEMINI_API_KEY missing.");
    
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    
    const result = await model.generateContent(prompt);
    const text = result.response?.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!text) {
        throw new Error("The Council blocked this prompt or returned empty data (Likely a safety filter or binary file request).");
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

    // ROUTE: THE COUNCIL (Python Bridge)
    if (trimmedPrompt.toLowerCase().startsWith('/council ')) {
        const task = trimmedPrompt.substring(9).trim();
        verdictText = await runCouncilTask('symbiote.py', [task]);
        verdictText = `### Council Output\n\n${verdictText}`;
    }
    // ROUTE: THE CODE ENGINE
    else if (trimmedPrompt.toLowerCase().startsWith('/code ')) {
        const codeQuery = trimmedPrompt.substring(6).trim();
        verdictText = await safeGeminiCall(`You are Artemis. Write code for: "${codeQuery}"`);
    }
    // ROUTE: TEXT ENGINE
    else {
        verdictText = await safeGeminiCall(prompt);
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
