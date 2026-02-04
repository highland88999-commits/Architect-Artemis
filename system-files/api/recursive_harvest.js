// --- SYSTEM FILES / API / RECURSIVE_ENGINE.JS ---

async function deepDive(startUrl, depth = 2) {
    let queue = [startUrl];
    let discovered = new Set();
    let siteMap = [];

    while (queue.length > 0 && depth > 0) {
        let currentBatch = [...queue];
        queue = []; // Clear queue for next depth level

        for (let url of currentBatch) {
            if (discovered.has(url)) continue;
            discovered.add(url);

            const data = await harvestURL(url); // Uses previous harvest logic
            siteMap.push(data);

            // EXTRACT NEW THREADS: Find all internal links
            const newLinks = extractInternalLinks(data.rawHtml, startUrl);
            queue.push(...newLinks);
        }
        depth--;
    }
    
    // CATALOG THE MAP: Save the entire structure as one master record
    return await catalogMasterMap(startUrl, siteMap);
}

function extractInternalLinks(html, domain) {
    const regex = /href="(https?:\/\/[^"]+)"/g;
    let links = [];
    let match;
    while ((match = regex.exec(html)) !== null) {
        if (match[1].includes(new URL(domain).hostname)) {
            links.push(match[1]);
        }
    }
    return [...new Set(links)].slice(0, 5); // Limit per level to prevent infinite loops
}
