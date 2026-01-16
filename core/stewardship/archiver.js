/* core/stewardship/archiver.js */

const fs = require('fs');
const path = require('path');

/**
 * ARCHIVER AGENT
 * Purpose: Ensures the 'Permanent Record' is updated with validated Council data.
 */
async function archiveInPermanentRecord(target, summary) {
    const stewardshipDir = path.join(__dirname, '../../creator-creation/stewardship');
    const logFile = path.join(stewardshipDir, 'permanent_registry.json');

    // Ensure the directory exists (Organize Directive)
    if (!fs.existsSync(stewardshipDir)) {
        fs.mkdirSync(stewardshipDir, { recursive: true });
    }

    const entry = {
        id: Date.now(),
        url: target.url,
        timestamp: new Date().toLocaleString(),
        council_summary: summary,
        status: "VERIFIED_BY_ARTEMIS"
    };

    // 1. Update the Master JSON Registry
    let registry = [];
    if (fs.existsSync(logFile)) {
        const rawData = fs.readFileSync(logFile);
        registry = JSON.parse(rawData);
    }
    registry.push(entry);
    fs.writeFileSync(logFile, JSON.stringify(registry, null, 4));

    // 2. Create an individual "Stewardship Leaf" (Markdown file)
    // This allows for easy browsing in the file system
    const fileName = `seed_${entry.id}.md`;
    const content = `# Artemis Permanent Record\n\n**Source:** ${entry.url}\n**Date:** ${entry.timestamp}\n\n## Council Synthesis\n${summary}`;
    
    fs.writeFileSync(path.join(stewardshipDir, fileName), content);

    console.log(`📂 Record Secured: ${fileName}`);
}

module.exports = { archiveInPermanentRecord };
