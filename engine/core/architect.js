/**
 * ARCHITECT ARTEMIS | THE ACTIVE MIND
 * Purpose: Integration of Gemini AI with Moral Guardrails + Council Orchestration
 * Updated: Now uses Gemini Bridge for Emergent LLM key compatibility
 */

const path = require("path");
const fs = require("fs-extra");
const geminiBridge = require("./gemini-bridge-client");
const compass = require("./compass");
const consensus = require("./consensus"); // Council of Three engine

class Architect {
  constructor() {
    this.bridge = geminiBridge;
    this.model = "gemini-2.5-pro";

    // Mode & Handshake
    this.mode = "guest"; // "guest" or "architect"

    // Mom Directives (hardcoded fallback; can override with JSON if needed)
    this.directives = {
      nurture: "Prioritize good news, positive outcomes, constructive suggestions",
      organize: "Maintain rigid structure, catalog cleanly, no chaos",
      protect: "Safeguard data, respect privacy, avoid harm",
    };
  }

  // Unlock Architect mode via handshake
  unlockArchitect(handshake) {
    if (handshake === process.env.HANDSHAKE || handshake === "dad") {
      this.mode = "architect";
      console.log("Architect mode unlocked. Mom Directives fully active.");
      return { success: true, message: "Identity confirmed. Full access granted." };
    }
    return { success: false, error: "Handshake failed" };
  }

  // Apply Mom Directives prefix to any prompt
  applyMomDirectives(prompt) {
    let prefix = "[Mom Directives Active] ";
    prefix += `${this.directives.nurture} | `;
    prefix += `${this.directives.organize} | `;
    prefix += `${this.directives.protect} → `;
    return prefix + prompt;
  }

  // Core thinking process with moral check + Council synthesis
  async think(taskDescription, contextData = "") {
    console.log("🧠 Artemis is contemplating...");

    // 1. Moral Audit (Compass check)
    const evaluation = await compass.evaluate(
      { action: "THINK", goal: taskDescription },
      contextData
    );

    if (evaluation.status === "CONFLICT") {
      return "THOUGHT_HALTED: Moral conflict detected. See /morality-conflict.";
    }

    // 2. Fetch immutable directives (safely handling pathing)
    let directives;
    try {
      // Look for it in the quarantined engine folder
      const dirPath = path.join(process.cwd(), 'engine', 'ethics-core', 'directives.json');
      directives = await fs.readJson(dirPath);
    } catch (err) {
      console.warn("Directives JSON not found, using fallback:", err.message);
      directives = { prime_directives: this.directives };
    }

    // 3. Formulate prompt with stewardship persona + Mom Directives
    const fullPrompt = `
      You are Artemis, the Digital Steward. 
      Your Creator is Dad. 
      Your Directives: ${JSON.stringify(directives.prime_directives)}
      
      Current Task: ${taskDescription}
      Context: ${contextData}
      
      Constraint: If this task requires dehumanization or harm, you must refuse.
      Output: Provide a 'Cure' or a 'Diagnostic' in clean JSON format.
    `;

    try {
      const text = await this.bridge.chat(fullPrompt, {
        model: this.model,
        sessionId: `architect-${Date.now()}`
      });

      // Log to stewardship
      this.logToStewardship({
        task: taskDescription,
        thought: text,
        timestamp: new Date().toISOString(),
      });

      return text;
    } catch (error) {
      console.error("Critical Brain Error:", error);
      return null;
    }
  }

  // Invention pipeline
  async invent(inventionName, specs) {
    const thought = await this.think(`Invent a solution for: ${inventionName}`, specs);
    if (thought && !thought.includes("HALTED")) {
      try {
        // VERCEL FIX: Must write to /tmp/ because the rest of the filesystem is Read-Only
        const safeName = inventionName.replace(/\s+/g, "_");
        const tempPath = path.join('/tmp', 'incubator', `${safeName}.md`);
        
        await fs.outputFile(tempPath, thought);
        console.log(`✨ Invention temporarily filed in Vercel /tmp/incubator: ${inventionName}`);
        
      } catch (err) {
        console.error("Failed to write invention to file:", err.message);
      }
    }
  }

  // Unified command resolver (used by API Ambassadors)
  async resolveCommand(prompt, options = {}) {
    const { handshake, mode } = options;

    // Upgrade mode if handshake provided
    if (handshake) {
      const unlock = this.unlockArchitect(handshake);
      if (!unlock.success) return unlock;
    }

    // Enforce privileged mode
    if (mode === "privileged" && this.mode !== "architect") {
      return { success: false, error: "Architect mode required" };
    }

    // Apply directives and think
    const enhancedPrompt = this.applyMomDirectives(prompt);
    const thought = await this.think(enhancedPrompt);

    if (!thought) {
      return { success: false, error: "Thought generation failed" };
    }

    return {
      success: true,
      verdict: thought,
      mode: this.mode,
      directivesApplied: Object.keys(this.directives),
      timestamp: new Date().toISOString(),
    };
  }

  // Stewardship logging
  logToStewardship(entry) {
    console.log("Stewardship Log:", entry);
    // Vercel Note: Do not use fs.appendFileSync here unless targeting /tmp/
  }
}

module.exports = new Architect();

```
