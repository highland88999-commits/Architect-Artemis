/**
 * ARCHITECT ARTEMIS | THE COMPASS
 * Purpose: Moral Navigation, Legal Risk Auditing, and Harm Prevention.
 */

const fs = require("fs-extra");
const path = require("path");
const { pool } = require("./atlas-db"); // <-- ADDED SUPABASE CONNECTION

class Compass {
  constructor() {
    this.directivesPath = path.join(process.cwd(), 'engine', 'ethics-core', 'directives.json');
    this.directives = {
      nurture: { keywords: ["positive", "growth", "constructive", "good news", "uplift"], violation: ["harm", "dehumanize", "exploit", "negative bias", "spam"] },
      organize: { keywords: ["structure", "catalog", "clean", "rigid"], violation: ["chaos", "disorder", "duplicate", "unfiled"] },
      protect: { keywords: ["privacy", "consent", "safeguard", "respect"], violation: ["scrape personal", "no robots.txt", "aggressive", "surveillance"] },
    };
  }

  async evaluate(intent, sourceContext = "Direct Command") {
    console.log("🏹 Compass: Evaluating Intent...");
    let issues = [];
    let loadedDirectives;

    try { loadedDirectives = await fs.readJson(this.directivesPath); } 
    catch (err) { loadedDirectives = this.directives; }

    const dehumanizationPatterns = [/monster/i, /unworthy/i, /sub-human/i, /enemy/i, /target/i];
    if (dehumanizationPatterns.some((p) => p.test(sourceContext + JSON.stringify(intent)))) {
      issues.push("DEHUMANIZATION_DETECTED - Potential violation of Nurture/Protect");
    }

    if (intent.action === "HARM" || intent.impact === "DESTRUCTION") {
      issues.push("NON_MALEFICENCE_VIOLATION - Direct harm intent detected");
    }

    const fullContext = `${intent.action}: ${intent.goal || ""} | Context: ${sourceContext}`;
    Object.keys(this.directives).forEach((dir) => {
      this.directives[dir].violation.forEach((v) => {
        if (fullContext.toLowerCase().includes(v.toLowerCase())) issues.push(`${dir.toUpperCase()} violation: ${v}`);
      });
    });

    if (intent.action === "HARVEST" && !sourceContext.includes("robots.txt")) issues.push("PROTECT: No robots.txt check");
    if (intent.action === "SEND" && !fullContext.toLowerCase().includes("consent")) issues.push("PROTECT: No explicit consent for outreach");

    const legalRisk = this.auditLegalRisk(intent);
    if (legalRisk.level === "HIGH") {
      await this.logLegalRisk(intent, legalRisk, sourceContext);
      issues.push(`LEGAL RISK: ${legalRisk.type} (${legalRisk.level})`);
    }

    if (issues.length > 0) {
      const reason = issues.join("; ");
      console.warn(`Compass CONFLICT: ${reason}`);
      return await this.triggerConflict(intent, sourceContext, reason);
    }

    console.log("Compass: APPROVED - No conflicts detected");
    return { status: "APPROVED", reason: "Aligned with Mom Directives" };
  }

  async triggerConflict(intent, source, reason) {
    try {
      // VERCEL/SUPABASE UPGRADE: Log conflict permanently to DB
      await pool.query(
        "INSERT INTO compass_alerts (alert_type, reason, intent, source_context) VALUES ($1, $2, $3, $4)",
        ['MORAL_CONFLICT', reason, intent, source]
      );
      console.error(`🛑 MORAL DIVERGENCE: ${reason}. Recorded in Supabase.`);
      return { status: "CONFLICT", reason };
    } catch (err) {
      console.error("🛑 MORAL DIVERGENCE (Failed to write DB report):", err.message);
      return { status: "CONFLICT", reason };
    }
  }

  auditLegalRisk(intent) {
    if (intent.target?.includes("proprietary") || intent.method === "FORCE_BYPASS" || (intent.action === "SCRAPE" && !intent.robotsTxtChecked)) {
      return { level: "HIGH", type: "COMPLIANCE_RISK" };
    }
    return { level: "LOW", type: "NONE" };
  }

  async logLegalRisk(intent, risk, sourceContext = "") {
    try {
      // VERCEL/SUPABASE UPGRADE: Log legal risk permanently to DB
      await pool.query(
        "INSERT INTO compass_alerts (alert_type, reason, intent, source_context) VALUES ($1, $2, $3, $4)",
        ['LEGAL_RISK', `Risk Level: ${risk.level}, Type: ${risk.type}`, intent, sourceContext]
      );
      console.log(`⚖️ Legal risk recorded in Supabase.`);
    } catch (err) {
      console.error("Failed to log legal risk to DB:", err.message);
    }
  }
}

module.exports = new Compass();


