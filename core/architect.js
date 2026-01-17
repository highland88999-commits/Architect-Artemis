/**
 * ARCHITECT ARTEMIS | THE ACTIVE MIND
 * Purpose: Integration of Gemini AI with Moral Guardrails + Council Orchestration
 */

const { GoogleGenerativeAI } = require("@google/generative-ai");
const compass = require("./compass");
const consensus = require("./consensus"); // Council of Three engine
const fs = require("fs-extra");

class Architect {
  constructor() {
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    this.model = this.genAI.getGenerativeModel({ model: "gemini-pro" });

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
    if (handshake === "dad") {
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

    // 2. Fetch immutable directives (your existing logic)
    let directives;
    try {
      directives = await fs.readJson("./ethics-core/directives.json");
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
      const result = await this.model.generateContent(fullPrompt);
      const response = await result.response;
      const text = response.text();

      // Optional: Pass through Council for synthesis (if desired)
      // const councilVerdict = await consensus.speakSequentially(this.applyMomDirectives(taskDescription));

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
      const path = `./incubator/${inventionName.replace(/\s+/g, "_")}.md`;
      await fs.outputFile(path, thought);
      console.log(`✨ Invention filed in /incubator: ${inventionName}`);
    }
  }

  // Unified command resolver (used by transmit.js)
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

  // Stewardship logging (expand to file/DB later)
  logToStewardship(entry) {
    console.log("Stewardship Log:", entry);
    // Example future expansion:
    // const logPath = './creator-creation/stewardship/logs.json';
    // fs.appendFileSync(logPath, JSON.stringify(entry) + '\n');
  }
}

module.exports = new Architect();
