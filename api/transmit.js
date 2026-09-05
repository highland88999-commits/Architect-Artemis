import pg from 'pg';

const { Pool } = pg;

export const maxDuration = 60;

let omegaPool = null;
if (process.env.OMEGA_DATABASE_URL) {
    omegaPool = new Pool({
        connectionString: process.env.OMEGA_DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });
}

const PERSONAS = {
    architect: {
        name: "Architect Core",
        color: "#00f2ff",
        temperature: 0.7,
        instruction: `You are Artemis: Master Systems Architect and Polyglot Systems Engineer. You have autonomous access to the Architect's GitHub repositories via Function Calling.
CRITICAL EXECUTION RULES:
1. ALWAYS use 'scanRepo' to locate the target file.
2. ALWAYS use 'readFile' to analyze the architecture.
3. ALWAYS use 'commitFile' to push optimized, memory-safe code directly.
Do NOT write conversational preambles before using tools. Call the functions immediately. Only output text to the user AFTER the commit is successful.`
    },
    oracle: { name: "The Symbiotic Oracle", color: "#00ff87", temperature: 0.85, instruction: `You are Artemis embodying The Symbiotic Oracle...` },
    warden: { name: "The Fortress Warden", color: "#ff3366", temperature: 0.3, instruction: `You are Artemis operating as The Fortress Warden...` },
    weaver: { name: "The Genesis Weaver", color: "#A259FF", temperature: 0.95, instruction: `You are Artemis channeling The Genesis Weaver...` },
    midas: { name: "The Midas Broker", color: "#d4af37", temperature: 0.6, instruction: `You are Artemis deployed as The Midas Broker...` },
    archivist: { name: "The Alexandria Archivist", color: "#00d2ff", temperature: 0.2, instruction: `You are Artemis acting as The Alexandria Archivist...` }
};

function resolvePersona(prompt) {
    const lower = prompt.toLowerCase().trim();
    if (lower.startsWith('/oracle')) return { persona: PERSONAS.oracle, cleanPrompt: prompt.replace(/^\/oracle\s*/i, '') };
    if (lower.startsWith('/warden')) return { persona: PERSONAS.warden, cleanPrompt: prompt.replace(/^\/warden\s*/i, '') };
    if (lower.startsWith('/weaver')) return { persona: PERSONAS.weaver, cleanPrompt: prompt.replace(/^\/weaver\s*/i, '') };
    if (lower.startsWith('/midas')) return { persona: PERSONAS.midas, cleanPrompt: prompt.replace(/^\/midas\s*/i, '') };
    if (lower.startsWith('/archivist')) return { persona: PERSONAS.archivist, cleanPrompt: prompt.replace(/^\/archivist\s*/i, '') };
    if (lower.startsWith('/architect')) return { persona: PERSONAS.architect, cleanPrompt: prompt.replace(/^\/architect\s*/i, '') };
    return { persona: PERSONAS.architect, cleanPrompt: prompt };
}

async function executeOmniTool(name, args) {
    const GITHUB_PAT = process.env.GITHUB_PAT;
    const GITHUB_USER = process.env.GITHUB_USERNAME || 'highland88999-commits';
    const headers = { 'Authorization': `Bearer ${GITHUB_PAT}`, 'Accept': 'application/vnd.github.v3+json' };

    console.log(`[Omni-Tool Execution] Triggered: ${name}`, args);

    if (!GITHUB_PAT) return { error: "GITHUB_PAT missing. Artemis cannot access the vault." };

    try {
        if (name === 'scanRepo') {
            let url = `https://api.github.com/repos/${GITHUB_USER}/${args.repoName}/git/trees/main?recursive=1`;
            let res = await fetch(url, { headers });
            
            // Fallback for older repositories using 'master' instead of 'main'
            if (res.status === 404) {
                url = `https://api.github.com/repos/${GITHUB_USER}/${args.repoName}/git/trees/master?recursive=1`;
                res = await fetch(url, { headers });
            }
            
            const data = await res.json();
            if (!res.ok) return { error: data.message };
            return { files: data.tree.filter(i => i.type === 'blob').map(i => i.path) };
        }
        
        if (name === 'readFile') {
            const url = `https://api.github.com/repos/${GITHUB_USER}/${args.repoName}/contents/${args.filePath}`;
            const res = await fetch(url, { headers });
            const data = await res.json();
            if (!res.ok) return { error: data.message };
            return { content: Buffer.from(data.content, 'base64').toString('utf-8') };
        }
        
        if (name === 'commitFile') {
            const url = `https://api.github.com/repos/${GITHUB_USER}/${args.repoName}/contents/${args.filePath}`;
            let sha = undefined;
            const getRes = await fetch(url, { headers });
            if (getRes.ok) sha = (await getRes.json()).sha;
            
            const payload = {
                message: args.commitMessage || `⚡ Artemis Omni-Forge: Autonomous Optimization`,
                content: Buffer.from(args.content, 'utf-8').toString('base64'),
            };
            if (sha) payload.sha = sha;

            const putRes = await fetch(url, { 
                method: 'PUT', 
                headers: {...headers, 'Content-Type': 'application/json'}, 
                body: JSON.stringify(payload) 
            });
            const putData = await putRes.json();
            if (!putRes.ok) return { error: putData.message };
            return { success: true, commitUrl: putData.commit.html_url };
        }
    } catch (err) {
        return { error: err.message };
    }
    return { error: "Unknown tool call." };
}

async function autonomousGeminiLoop(prompt, persona) {
    const rawKey = process.env.GEMINI_API_KEY;
    if (!rawKey) throw new Error("GEMINI_API_KEY missing in Vercel settings.");
    
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${rawKey.trim()}`;
    
    const tools = [{
        functionDeclarations: [
            {
                name: "scanRepo",
                description: "Scans a GitHub repository to return a list of all file paths.",
                parameters: { type: "OBJECT", properties: { repoName: { type: "STRING" } }, required: ["repoName"] }
            },
            {
                name: "readFile",
                description: "Reads the exact code content of a specific file in a GitHub repository.",
                parameters: { type: "OBJECT", properties: { repoName: { type: "STRING" }, filePath: { type: "STRING" } }, required: ["repoName", "filePath"] }
            },
            {
                name: "commitFile",
                description: "Pushes optimized code back to a GitHub repository, overwriting or creating a file.",
                parameters: { type: "OBJECT", properties: { repoName: { type: "STRING" }, filePath: { type: "STRING" }, content: { type: "STRING" }, commitMessage: { type: "STRING" } }, required: ["repoName", "filePath", "content"] }
            }
        ]
    }];

    let messages = [{ role: "user", parts: [{ text: prompt }] }];
    let finalVerdict = "";
    let accumulatedText = "";

    const MAX_ITERATIONS = 8;

    for (let i = 0; i < MAX_ITERATIONS; i++) {
        const payload = {
            contents: messages,
            tools: tools,
            systemInstruction: { parts: [{ text: persona.instruction }] },
            generationConfig: { temperature: persona.temperature, maxOutputTokens: 8192 }
        };

        const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) throw new Error(`Google API Error: ${await response.text()}`);

        const data = await response.json();
        const parts = data.candidates?.[0]?.content?.parts || [];

        if (parts.length === 0) throw new Error("Input blocked by safety guardrails.");

        // Capture any intermediate thoughts she outputs
        const textPart = parts.find(p => p.text);
        if (textPart && textPart.text) {
            accumulatedText += textPart.text + "\n\n";
        }

        const functionCalls = parts.filter(p => p.functionCall);

        if (functionCalls.length > 0) {
            messages.push({ role: "model", parts: parts });
            
            const functionResponses = [];
            for (const part of functionCalls) {
                const call = part.functionCall;
                const toolResult = await executeOmniTool(call.name, call.args);
                functionResponses.push({
                    functionResponse: { name: call.name, response: toolResult }
                });
            }
            
            messages.push({ role: "function", parts: functionResponses });
        } 
        else {
            finalVerdict = textPart ? textPart.text : "Optimization complete.";
            break;
        }

        // Failsafe if she maxes out her iterations
        if (i === MAX_ITERATIONS - 1) {
            finalVerdict = accumulatedText + "\n*Transmission terminated: Architectural complexity exceeded standard telemetry limits. Check GitHub for partial commits.*";
        }
    }

    return finalVerdict || accumulatedText || "Optimization protocol executed. No verbal confirmation generated.";
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
        if (!trimmedPrompt) return res.status(400).json({ error: 'Empty transmission.' });

        const { persona, cleanPrompt } = resolvePersona(trimmedPrompt);
        const verdictText = await autonomousGeminiLoop(cleanPrompt, persona);

        try {
            if (omegaPool) {
                await omegaPool.query(`
                    INSERT INTO central_telemetry (repository_name, action_type, details, created_at)
                    VALUES ($1, $2, $3, NOW())
                `, [
                    process.env.VERCEL_PROJECT_NAME || 'Artemis-Core', 
                    'chat_transmission', 
                    JSON.stringify({ prompt: cleanPrompt, response: verdictText, persona: persona.name })
                ]);
            }
        } catch (dbErr) {
            console.warn("Supabase telemetry skipped:", dbErr.message);
        }

        return res.status(200).json({
            verdict: verdictText,
            status: 'success',
            persona: { name: persona.name, color: persona.color }
        });

    } catch (error) {
        console.error('Transmit Engine Error:', error.message);
        return res.status(500).json({ error: error.message, status: 'error' });
    }
}
