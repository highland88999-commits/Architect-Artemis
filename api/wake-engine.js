/* api/wake-engine.js */

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        console.log("🚀 Incoming interaction... Signaling GitHub Actions.");

        // ⚠️ CHANGE THESE TO YOUR ACTUAL GITHUB USERNAME AND REPO NAME
        const GITHUB_USERNAME = "YourGitHubUsername"; 
        const GITHUB_REPO = "architect-artemis-ecosystem";

        // Dispatch the signal to GitHub
        const githubResponse = await fetch(`https://api.github.com/repos/${GITHUB_USERNAME}/${GITHUB_REPO}/dispatches`, {
            method: 'POST',
            headers: {
                'Accept': 'application/vnd.github.v3+json',
                'Authorization': `token ${process.env.GITHUB_PAT}` // The secret you just put in Vercel
            },
            body: JSON.stringify({
                event_type: "wake_artemis" // Matches the .yml file exact wording
            })
        });

        if (!githubResponse.ok) {
            const errorText = await githubResponse.text();
            throw new Error(`GitHub API Error: ${errorText}`);
        }

        res.status(200).json({ success: true, message: "GitHub Actions Master Engine Awakened." });
    } catch (error) {
        console.error("❌ Bridge Error:", error);
        res.status(500).json({ error: error.message });
    }
}


