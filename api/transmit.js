const { GoogleGenerativeAI } = require('@google/generative-ai');
const { PythonShell } = require('python-shell');

// Bridge function to run your Python engine
async function runCouncilTask(scriptName, args = []) {
    return new Promise((resolve, reject) => {
        let options = {
            mode: 'text',
            pythonPath: 'python3',
            scriptPath: './engine',
            args: args
        };

        PythonShell.run(scriptName, options, function (err, results) {
            if (err) reject(err);
            resolve(results ? results.join('\n') : "Council task executed.");
        });
    });
}

module.exports = async function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { prompt, handshake, mode, jobId } = req.body;
  if (handshake !== 'CONNECTED') return res.status(401).json({ error: 'Unauthorized' });

  try {
    const trimmedPrompt = prompt ? prompt.trim() : "";

    // ==========================================
    // ROUTE: THE COUNCIL (Python Bridge)
    // ==========================================
    if (trimmedPrompt.toLowerCase().startsWith('/council ')) {
        const task = trimmedPrompt.substring(9).trim();
        // Routes /council harvest -> engine/symbiote.py harvest
        const result = await runCouncilTask('symbiote.py', [task]);
        return res.status(200).json({ verdict: `### Council Output\n\n${result}`, status: 'success' });
    }

    // ==========================================
    // ROUTE: THE CODE ENGINE
    // ==========================================
    if (trimmedPrompt.toLowerCase().startsWith('/code ')) {
        const codeQuery = trimmedPrompt.substring(6).trim();
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
        const systemPrompt = `You are Artemis... (keep your previous system prompt here)... "${codeQuery}"`;
        const result = await model.generateContent(systemPrompt);
        return res.status(200).json({ verdict: result.response.text(), status: 'success' });
    }

    // ==========================================
    // ROUTE: TEXT ENGINE
    // ==========================================
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const result = await model.generateContent(prompt);
    return res.status(200).json({ verdict: result.response.text(), status: 'success' });

  } catch (error) {
    return res.status(500).json({ error: `Artemis Backend Error: ${error.message}` });
  }
};


```
