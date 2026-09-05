// api/github-forge.js

// Vercel Serverless execution timeout set to 60 seconds
export const maxDuration = 60;

export default async function handler(req, res) {
    // --- CORS PREFLIGHT ---
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    const { action, repoName, filePath, content, commitMessage, handshake } = body;

    // --- SECURITY LOCK ---
    if (handshake !== 'CONNECTED') {
        return res.status(401).json({ error: 'Unauthorized. Artemis Landline severed.' });
    }

    const GITHUB_PAT = process.env.GITHUB_PAT;
    const GITHUB_USER = process.env.GITHUB_USERNAME || 'highland88999-commits';

    if (!GITHUB_PAT) {
        return res.status(503).json({ error: 'GITHUB_PAT is missing in Vercel environment variables.' });
    }

    const headers = {
        'Authorization': `Bearer ${GITHUB_PAT}`,
        'Accept': 'application/vnd.github.v3+json',
        'X-GitHub-Api-Version': '2022-11-28'
    };

    try {
        // ---------------------------------------------------------
        // ACTION 1: SCAN REPOSITORY (Read folder structure)
        // ---------------------------------------------------------
        if (action === 'scanRepo') {
            if (!repoName) throw new Error("repoName is required for scanning.");
            
            const url = `https://api.github.com/repos/${GITHUB_USER}/${repoName}/git/trees/main?recursive=1`;
            const response = await fetch(url, { headers });
            
            if (!response.ok) throw new Error(`GitHub API Error: ${await response.text()}`);
            
            const data = await response.json();
            // Filter out trees (folders), return only blobs (files)
            const files = data.tree.filter(item => item.type === 'blob').map(item => item.path);
            
            return res.status(200).json({ success: true, files });
        }

        // ---------------------------------------------------------
        // ACTION 2: READ REPOSITORY FILE (Extract code)
        // ---------------------------------------------------------
        if (action === 'readFile') {
            if (!repoName || !filePath) throw new Error("repoName and filePath are required.");
            
            const url = `https://api.github.com/repos/${GITHUB_USER}/${repoName}/contents/${filePath}`;
            const response = await fetch(url, { headers });
            
            if (!response.ok) throw new Error(`GitHub API Error: ${await response.text()}`);
            
            const data = await response.json();
            // GitHub returns Base64 encoded content; decode it to raw text
            const fileContent = Buffer.from(data.content, 'base64').toString('utf-8');
            
            return res.status(200).json({ success: true, content: fileContent });
        }

        // ---------------------------------------------------------
        // ACTION 3: OMNI-FORGE COMMIT (Write/Update code)
        // ---------------------------------------------------------
        if (action === 'commitFile') {
            if (!repoName || !filePath || !content) {
                throw new Error("repoName, filePath, and content are required to forge a commit.");
            }
            
            const url = `https://api.github.com/repos/${GITHUB_USER}/${repoName}/contents/${filePath}`;

            // Step 1: Check if file already exists to grab its SHA hash
            let sha = undefined;
            const getResponse = await fetch(url, { headers });
            if (getResponse.ok) {
                const getData = await getResponse.json();
                sha = getData.sha;
            }

            // Step 2: Push the new code
            const payload = {
                message: commitMessage || `⚡ Artemis Omni-Forge: Optimized ${filePath}`,
                content: Buffer.from(content, 'utf-8').toString('base64'),
            };
            
            // GitHub requires the SHA to overwrite an existing file
            if (sha) payload.sha = sha;

            const putResponse = await fetch(url, {
                method: 'PUT',
                headers: { ...headers, 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!putResponse.ok) {
                throw new Error(`Commit Failed: ${await putResponse.text()}`);
            }
            
            const putData = await putResponse.json();

            console.log(`[Omni-Forge] Successfully pushed to ${repoName}/${filePath}`);
            return res.status(200).json({ 
                success: true, 
                commitUrl: putData.commit.html_url,
                message: `Successfully synthesized and pushed to ${repoName}/${filePath}`
            });
        }

        return res.status(400).json({ error: `Unknown Omni-Forge action: ${action}` });

    } catch (error) {
        console.error('GitHub Forge Error:', error.message);
        return res.status(500).json({ success: false, error: error.message });
    }
}
