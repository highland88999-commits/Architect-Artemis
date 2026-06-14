/* engine/core/stewardship/archiver.js */
const { pool } = require('../atlas-db'); // Wired to Supabase!

/**
 * ARCHITECT ARTEMIS | UNIFIED STEWARDSHIP ARCHIVER
 * Purpose: Atomic archival of Optimization & Invention data for Batch Cycles.
 * Upgraded to use Supabase Postgres instead of the Read-Only Vercel filesystem.
 */
async function archiveInPermanentRecord(target, result) {
    // 1. Sanitize for Naming
    const siteName = target.url
        .replace(/^https?:\/\//, '')
        .replace(/\/$/, '')
        .replace(/[^a-z0-9]/gi, '_');

    const timestamp = new Date().toLocaleString();

    // 2. Optimization Report (Mission File 1)
    const reportContent = `
# 🛠️ OPTIMIZATION: ${target.url}
**Artemis Nurture Score:** ${result.nurture_score}/10
**Timestamp:** ${timestamp}

## 📞 CONTACT INFORMATION
${result.contact_info || "No direct contact data harvested."}

## 📊 COUNCIL METRICS
- Gemini: ${result.metrics?.gemini || 'N/A'}
- Copilot: ${result.metrics?.copilot || 'N/A'}
- Grok: ${result.metrics?.grok || 'N/A'}

## ⚙️ STRUCTURAL STEPS
${result.optimization_steps}
    `.trim();

    // 3. Invention Idea (Mission File 2)
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
        console.log(`📂 Archiving data for ${siteName} to Supabase...`);

        // 4. Atomic Database Writes
        // Save the Optimization Report to the Stewardship Logs table
        await pool.query(
            "INSERT INTO stewardship_logs (task, thought) VALUES ($1, $2)",
            [`Optimization Audit: ${target.url}`, reportContent]
        );

        // Save the generated Invention to the Inventions table
        await pool.query(
            "INSERT INTO inventions (title, content) VALUES ($1, $2)",
            [`Synthetic Blueprint: ${siteName}`, inventionContent]
        );
        
        console.log(`✅ Permanent Record Secured in Supabase: ${siteName}`);
        return { success: true, folder: siteName };

    } catch (error) {
        console.error(`❌ Archival Failure for ${siteName} to Supabase: ${error.message}`);
        throw error;
    }
}

module.exports = { archiveInPermanentRecord };


