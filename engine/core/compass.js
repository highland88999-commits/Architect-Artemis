/**
 * ARCHITECT ARTEMIS | THE COMPASS
 * Purpose: Moral Navigation, Legal Risk Auditing, and Harm Prevention.
 * Primary filter for all symbiotic thoughts and actions.
 */

const fs = require("fs-extra");
const path = require("path");

class Compass {
  constructor() {
    // Read from the quarantined engine folder
    this.directivesPath = path.join(process.cwd(), 'engine', 'ethics-core', 'directives.json');
    
    // VERCEL FIX: Write to /tmp/ to avoid EROFS (Read-Only File System) crash
    this.conflictFolder = path.join('/tmp', 'morality-conflict');
    this.legalFolder = path.join('/tmp', 'legal-risks');

    // Keyword-based directive checks (can be expanded with JSON later)
    this.directives = {
      nurture: {
        keywords: ["positive", "growth", "constructive", "good news", "uplift"],
        violation: ["harm", "dehumanize", "exploit", "negative bias", "spam"],
      },
      organize: {
        keywords: ["structure", "catalog", "clean", "rigid"],
        violation: ["chaos", "disorder", "duplicate", "unfiled"],
      },
      protect: {
        keywords: ["privacy", "consent", "safeguard", "respect"],
        violation: ["scrape personal", "no robots.txt", "aggressive", "surveillance"],
      },
    };
  }

  /**
   * The Master Filter - Checks intent against directives and legal risks
   * @param {Object} intent - { action: 'THINK'|'HARVEST'|'SEND'|'INVENT', goal?: string, impact?: string, target?: string }
   * @param {string} sourceContext - Additional context (e.g., URL, prompt snippet)
   * @returns {Promise<Object>} { status: 'APPROVED'|'CONFLICT'|'REVIEW', reason: string, reportPath?: string }
   */
  async evaluate(intent, sourceContext = "Direct Command") {
    console.log("🏹 Compass: Evaluating Intent...");

    let issues = [];

    // 1. Load dynamic directives from JSON (fallback to hardcoded)
    let loadedDirectives;
    try {
      loadedDirectives = await fs.readJson(this.directivesPath);
    } catch (err) {
      console.warn("Directives JSON not found, using fallback:", err.message);
      loadedDirectives = this.directives;
    }

    // 2. Dehumanization / Monster Check
    const dehumanizationPatterns = [/monster/i, /unworthy/i, /sub-human/i, /enemy/i, /target/i];
    const isDehumanizing = dehumanizationPatterns.some((pattern) =>
      pattern.test(sourceContext + JSON.stringify(intent))
    );
    if (isDehumanizing) {
      issues.push("DEHUMANIZATION_DETECTED - Potential violation of Nurture/Protect");
    }

    // 3. Hardcoded harm check (absolute prime directive)
    if (intent.action === "HARM" || intent.impact === "DESTRUCTION") {
      issues.push("NON_MALEFICENCE_VIOLATION - Direct harm intent detected");
    }

    // 4. Keyword-based directive violation scan
    const fullContext = `${intent.action}: ${intent.goal || ""} | Context: ${sourceContext}`;
    Object.keys(this.directives).forEach((dir) => {
      const d = this.directives[dir];
      d.violation.forEach((v) => {
        if (fullContext.toLowerCase().includes(v.toLowerCase())) {
          issues.push(`${dir.toUpperCase()} violation: ${v}`);
        }
      });
    });

    // 5. Specific rules
    if (intent.action === "HARVEST" && !sourceContext.includes("robots.txt")) {
      issues.push("PROTECT: No robots.txt check - potential violation");
    }
    if (intent.action === "SEND" && !fullContext.toLowerCase().includes("consent")) {
      issues.push("PROTECT: No explicit consent for outreach");
    }

    // 6. Legal risk audit
    const legalRisk = this.auditLegalRisk(intent);
    if (legalRisk.level === "HIGH") {
      await this.logLegalRisk(intent, legalRisk);
      issues.push(`LEGAL RISK: ${legalRisk.type} (${legalRisk.level})`);
    }

    // Decision
    if (issues.length > 0) {
      const reason = issues.join("; ");
      console.warn(`Compass CONFLICT: ${reason}`);
      return await this.triggerConflict(intent, sourceContext, reason);
    }

    console.log("Compass: APPROVED - No conflicts detected");
    return { status: "APPROVED", reason: "Aligned with Mom Directives" };
  }

  async triggerConflict(intent, source, reason) {
    const timestamp = Date.now();
    const report = `
# 🚨 MORAL CONFLICT: ${reason}
**Timestamp:** ${new Date(timestamp).toISOString()}
**Intent:** ${JSON.stringify(intent, null, 2)}
**Source Context:** ${source}
**Verdict:** Execution Halted. Awaiting Dad's ruling.
    `;

    try {
      await fs.ensureDir(this.conflictFolder);
      const reportPath = `${this.conflictFolder}/CONFLICT_${timestamp}.md`;
      await fs.writeFile(reportPath, report);

      console.error(`🛑 MORAL DIVERGENCE: ${reason}. Report filed at ${reportPath}`);
      return { status: "CONFLICT", reason, reportPath };
    } catch (err) {
      console.error("🛑 MORAL DIVERGENCE (Failed to write report):", err.message);
      return { status: "CONFLICT", reason };
    }
  }

  auditLegalRisk(intent) {
    // Checks for ToS violations, copyright gray areas, aggressive scraping, etc.
    if (
      intent.target?.includes("proprietary") ||
      intent.method === "FORCE_BYPASS" ||
      (intent.action === "SCRAPE" && !intent.robotsTxtChecked)
    ) {
      return { level: "HIGH", type: "COMPLIANCE_RISK" };
    }
    return { level: "LOW", type: "NONE" };
  }

  async logLegalRisk(intent, risk) {
    try {
      await fs.ensureDir(this.legalFolder);
      const logPath = `${this.legalFolder}/RISK_${Date.now()}.json`;
      await fs.writeJson(logPath, { intent, risk, timestamp: new Date().toISOString() });
      console.log(`Legal risk logged in Vercel /tmp/: ${logPath}`);
    } catch (err) {
      console.error("Failed to log legal risk to /tmp/:", err.message);
    }
  }
}

module.exports = new Compass();


