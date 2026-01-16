// --- SYSTEM FILES / API / CRAWLER.JS ---
const GITHUB_TOKEN = process.env.GITHUB_TOKEN; // Your Secure Token

async function harvestURL(targetUrl) {
    try {
        // 1. CRAWL: Fetch the raw HTML
        const response = await fetch(targetUrl);
        const html = await response.text();

        // 2. HARVEST: Extract Title, Meta Description, and Key Terms
        const title = html.match(/<title>(.*?)<\/title>/)?.[1] || "Untitled";
        const description = html.match(/<meta name="description" content="(.*?)"/)?.[1] || "No description found.";
        
        const intelligence = {
            url: targetUrl,
            identity: title,
            summary: description,
            timestamp: new Date().toISOString(),
            status: "CATALOGED"
        };

        // 3. CATALOG: Push to your GitHub Repository Log
        await catalogToGitHub(intelligence);
        return intelligence;
    } catch (error) {
        return { error: "Link Unstable", details: error.message };
    }
}

async function catalogToGitHub(data) {
    const fileName = `Artemis_Log/Stewardship/Catalog_${Date.now()}.json`;
    const content = btoa(JSON.stringify(data, null, 2));

    // This calls the GitHub API to permanently store the harvested data
    await fetch(`https://api.github.com/repos/YOUR_USER/YOUR_REPO/contents/${fileName}`, {
        method: 'PUT',
        headers: {
            'Authorization': `token ${GITHUB_TOKEN}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            message: `Artemis Cataloged: ${data.url}`,
            content: content
        })
    });
}
