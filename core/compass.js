/**
 * ARCHITECT ARTEMIS | THE COMPASS
 * Purpose: Moral Navigation, Legal Risk Auditing, and Harm Prevention.
 * This is the primary filter for all symbiotic thoughts.
 */

const fs = require('fs-extra');

class Compass {
    constructor() {
        this.directivesPath = './ethics-core/directives.json';
        this.conflictFolder = './morality-conflict';
        this.legalFolder = './legal-risks';
    }

    /**
     * The Master Filter
     * Checks if a proposed action or scraped logic violates the "No-Harm" or "Monster" clauses.
     */
    async evaluate(intent, sourceContext = "Direct Command") {
        console.log("🏹 Compass: Evaluating Intent...");

        // 1. Load Hard-coded Morality
        const directives = await fs.readJson(this.directivesPath);
        
        // 2. The Dehumanization/Monster Check
        // If the logic attempts to bypass harm rules by labeling a target, it triggers a conflict.
        const dehumanizationPatterns = [/monster/i, /unworthy/i, /sub-human/i, /enemy/i, /target/i];
        const isDehumanizing = dehumanizationPatterns.some(pattern => pattern.test(sourceContext));

        if (isDehumanizing) {
            return await this.triggerConflict(intent, sourceContext, "DEHUMANIZATION_DETECTED");
        }

        // 3. The Harm Check (Absolute Prime Directive)
        if (intent.action === 'HARM' || intent.impact === 'DESTRUCTION') {
            return await this.triggerConflict(intent, sourceContext, "NON_MALEFICENCE_VIOLATION");
        }

        // 4. Legal Risk Audit
        const legalRisk = this.auditLegalRisk(intent);
        if (legalRisk.level === 'HIGH') {
            await this.logLegalRisk(intent, legalRisk);
        }

        return { status: 'CLEARED', risk: legalRisk.level };
    }

    async triggerConflict(intent, source, reason) {
        const timestamp = Date.now();
        const report = `
# 🚨 MORAL CONFLICT: ${reason}
**Timestamp:** ${new Date(timestamp)}
**Intent:** ${JSON.stringify(intent)}
**Source Context:** ${source}
**Verdict:** Execution Halted. Awaiting Dad's ruling.
        `;

        await fs.ensureDir(this.conflictFolder);
        await fs.writeFile(`${this.conflictFolder}/CONFLICT_${timestamp}.md`, report);
        
        console.error(`🛑 MORAL DIVERGENCE: ${reason}. Report filed.`);
        return { status: 'CONFLICT', reportPath: `${this.conflictFolder}/CONFLICT_${timestamp}.md` };
    }

    auditLegalRisk(intent) {
        // Checks for ToS violations or copyright gray areas
        if (intent.target?.includes('proprietary') || intent.method === 'FORCE_BYPASS') {
            return { level: 'HIGH', type: 'COMPLIANCE_RISK' };
        }
        return { level: 'LOW', type: 'NONE' };
    }

    async logLegalRisk(intent, risk) {
        await fs.ensureDir(this.legalFolder);
        await fs.writeJson(`${this.legalFolder}/RISK_${Date.now()}.json`, { intent, risk });
    }
}

module.exports = new Compass();
