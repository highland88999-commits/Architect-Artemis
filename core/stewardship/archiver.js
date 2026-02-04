/* core/stewardship/archiver.js */

const fs = require('fs');
const path = require('path');

/**
 * ARCHITECT ARTEMIS | UNIFIED STEWARDSHIP ARCHIVER
 * Purpose: Atomic archival of Optimization & Invention data for Batch Cycles.
 */
async function archiveInPermanentRecord(target, result) {
    const baseDir = path.join(__dirname, '../../creator-creation/stewardship');
    const registryFile = path.join(baseDir, 'permanent_registry.json');

    // 1. Sanitize for Folder Naming (URL to Folder Name)
    const siteName = target.url
        .replace(/^https?:\/\//, '')
        .replace(/\/$/, '')
        .replace(/[^a-z0-9]/gi, '_');
    
    const siteDir = path.join(baseDir, siteName);

    // 2. Ensure Folder Integrity
    if (!fs.existsSync(siteDir)) fs.mkdirSync(siteDir, { recursive: true });

    const timestamp = new Date().toLocaleString();

    // 3. Optimization Report (Mission File 1)
    const reportContent = `
# 🛠️ OPTIMIZATION: ${target.url}
**Artemis Nurture Score:** ${result.nurture_score}/10
**Timestamp:** ${timestamp}

## 📞 CONTACT INFORMATION
${result.contact_info || "No direct contact data harvested."}

## 📊 COUNCIL METRICS
- Gemini: ${result.metrics.gemini}
- Copilot: ${result.metrics.copilot}
- Grok: ${result.metrics.grok}

## ⚙️ STRUCTURAL STEPS
${result.optimization_steps}
    `.trim();

    // 4. Invention Idea (Mission File 2)
    const inventionContent = `
# ✨ INVENTION: ${siteName}
**Directive:** NURTURE

## 💡 CONCEPT
${result.invention_idea}

## 🛠️ CODE BLUEPRINT
\`\`\`javascript
${result.blueprint_code}
\`\`\`
    `.trim();

    try {
        // Atomic Write
        fs.writeFileSync(path.join(siteDir, 'Optimization_Report.md'), reportContent);
        fs.writeFileSync(path.join(siteDir, 'Invention_Idea.md'), inventionContent);

        // 5. Update Master Registry
        let registry = [];
        if (fs.existsSync(registryFile)) {
            registry = JSON.parse(fs.readFileSync(registryFile, 'utf8'));
        }
        
        registry.push({
            id: Date.now(),
            site: siteName,
            url: target.url,
            score: result.nurture_score,
            timestamp: timestamp
        });

        fs.writeFileSync(registryFile, JSON.stringify(registry, null, 4));
        
        console.log(`📂 Permanent Record Secured: ${siteName}`);
        return { success: true, folder: siteName };
    } catch (error) {
        console.error(`❌ Archival Failure for ${siteName}: ${error.message}`);
        throw error;
    }
}

module.exports = { archiveInPermanentRecord };
