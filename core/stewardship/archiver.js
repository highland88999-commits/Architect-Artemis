/* core/stewardship/archiver.js */

const fs = require('fs');
const path = require('path');

/**
 * ARCHITECT ARTEMIS | STEWARDSHIP ARCHIVER
 * Purpose: Merging technical optimization and creative invention into the Permanent Record.
 */
async function archiveInPermanentRecord(target, councilData) {
    const baseDir = path.join(__dirname, '../../creator-creation/stewardship');
    
    // 1. Sanitize for Folder Naming
    const siteName = target.url
        .replace(/^https?:\/\//, '')
        .replace(/\/$/, '')
        .replace(/[/\\?%*:|"<>\s]/g, '_');
    
    const siteDir = path.join(baseDir, siteName);
    const registryFile = path.join(baseDir, 'permanent_registry.json');

    // 2. Ensure Folder Integrity (Organize Directive)
    if (!fs.existsSync(siteDir)) fs.mkdirSync(siteDir, { recursive: true });

    // 3. Prepare File Contents
    const timestamp = new Date().toLocaleString();
    
    // Optimization Report Content
    const reportContent = `
# 🛠️ OPTIMIZATION REPORT: ${target.url}
**Timestamp:** ${timestamp}

## 📞 Contact Information
${target.contactInfo || "No direct contact data found."}

## 📊 Council Analysis
- **Gemini (Efficiency):** ${councilData.gemini_metrics || "Pending"}
- **Copilot (Logic):** ${councilData.copilot_logic || "Pending"}
- **Grok (Truth):** ${councilData.grok_unfiltered || "Pending"}

## ⚙️ Structural Improvements
${councilData.optimization_steps || "No improvements identified."}
    `.trim();

    // Invention Idea Content
    const inventionContent = `
# ✨ INVENTION IDEA: ${siteName}
**Directive:** NURTURE

## 💡 The Concept
${councilData.invention_idea || "Generating innovation..."}

## 🛠️ Technical Blueprint
\`\`\`javascript
${councilData.blueprint_code || "// Logic pending synthesis"}
\`\`\`
    `.trim();

    // 4. Atomic Write to File System
    try {
        fs.writeFileSync(path.join(siteDir, `Optimization_Report.md`), reportContent);
        fs.writeFileSync(path.join(siteDir, `Invention_Idea.md`), inventionContent);

        // 5. Update Master Registry (System Tracking)
        let registry = [];
        if (fs.existsSync(registryFile)) {
            registry = JSON.parse(fs.readFileSync(registryFile, 'utf8'));
        }
        
        registry.push({
            id: Date.now(),
            site: siteName,
            url: target.url,
            path: siteDir,
            timestamp: timestamp
        });

        fs.writeFileSync(registryFile, JSON.stringify(registry, null, 4));
        
        console.log(`📂 Stewardship Success: Folder created for ${siteName}`);
        return { success: true, folder: siteName };
    } catch (error) {
        console.error(`❌ Archival Failure: ${error.message}`);
        throw error;
    }
}

module.exports = { archiveInPermanentRecord };
