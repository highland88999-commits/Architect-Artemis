import { GoogleGenerativeAI } from '@google/generative-ai';
import { PythonShell } from 'python-shell';
import { triggerSentimentAnalysis } from '../core/synaptic-bridge.js';

async function runCouncilTask(scriptName, args = []) {
    return new Promise((resolve, reject) => {
        let options = { mode: 'text', pythonPath: 'python3', scriptPath: './engine', args: args };
        PythonShell.run(scriptName, options, function (err, results) {
            if (err) reject(err);
            resolve(results ? results.join('\n') : "Council task executed.");
        });
    });
}

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  // Failsafe: Ensure Vercel parses the payload as an object, not a raw string
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
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
        const result = await model.generateContent(`You are Artemis. Write code for: "${codeQuery}"`);
        verdictText = result.response.text();
    }
    // ROUTE: TEXT ENGINE
    else {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
        const result = await model.generateContent(prompt);
        verdictText = result.response.text();
    }

    // --- SYNAPTIC BRIDGE: EMOTIONAL MATRIX ---
    let sentiment = 'NEUTRAL';
    try {
        // Analyze the first 500 characters to prevent payload bloat
        const mlResult = await triggerSentimentAnalysis(verdictText.substring(0, 500));
        if (mlResult && mlResult.success) {
            sentiment = mlResult.label; // Returns 'POSITIVE', 'NEGATIVE', or 'NEUTRAL'
        }
    } catch (e) {
        console.warn("Sentiment matrix offline, defaulting to NEUTRAL");
    }

    return res.status(200).json({ verdict: verdictText, status: 'success', sentiment: sentiment });

  } catch (error) {
    return res.status(500).json({ error: `Artemis Backend Error: ${error.message}` });
  }
}
