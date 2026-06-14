/**
 * ARCHITECT ARTEMIS | THE ACTIVE MIND
 * Purpose: Integration of Gemini AI with Moral Guardrails + Council Orchestration
 */

const path = require("path");
const fs = require("fs-extra");
const geminiBridge = require("./gemini-bridge-client");
const compass = require("./compass");
const { pool } = require("./atlas-db"); // <-- ADDED SUPABASE CONNECTION

class Architect {
  constructor() {
    this.bridge = geminiBridge;
    this.model = "gemini-2.5-pro";
    this.mode = "guest"; 
    this.directives = {
      nurture: "Prioritize good news, positive outcomes, constructive suggestions",
      organize: "Maintain rigid structure, catalog cleanly, no chaos",
      protect: "Safeguard data, respect privacy, avoid harm",
    };
  }

  unlockArchitect(handshake) {
    if (handshake === process.env.HANDSHAKE || handshake === "dad") {
      this.mode = "architect";
      console.log("Architect mode unlocked. Mom Directives fully active.");
      return { success: true, message: "Identity confirmed. Full access granted." };
    }
    return { success: false, error: "Handshake failed" };
  }

  applyMomDirectives(prompt) {
    let prefix = "[Mom Directives Active] ";
    prefix += `${this.directives.nurture} | `;
    prefix += `${this.directives.organize} | `;
    prefix += `${this.directives.protect} → `;
    return prefix + prompt;
  }

  async think(taskDescription, contextData = "") {
    console.log("🧠 Artemis is contemplating...");

    const evaluation = await compass.evaluate({ action: "THINK", goal: taskDescription }, contextData);
    if (evaluation.status === "CONFLICT") {
      return "THOUGHT_HALTED: Moral conflict detected. See Supabase compass_alerts table.";
    }

    let directives;
    try {
      const dirPath = path.join(process.cwd(), 'engine', 'ethics-core', 'directives.json');
      directives = await fs.readJson(dirPath);
    } catch (err) {
      directives = { prime_directives: this.directives };
    }

    const fullPrompt = `
      You are Artemis, the Digital Steward. Your Creator is Dad. 
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

      // VERCEL/SUPABASE UPGRADE: Permanently log to Supabase
      await this.logToStewardship({ task: taskDescription, thought: text });

      return text;
    } catch (error) {
      console.error("Critical Brain Error:", error);
      return null;
    }
  }

  async invent(inventionName, specs) {
    const thought = await this.think(`Invent a solution for: ${inventionName}`, specs);
    if (thought && !thought.includes("HALTED")) {
      try {
        // VERCEL/SUPABASE UPGRADE: Write directly to Postgres/Supabase Memory
        await pool.query(
          "INSERT INTO inventions (title, content) VALUES ($1, $2)",
          [inventionName, thought]
        );
        console.log(`✨ Invention permanently filed in Supabase: ${inventionName}`);
      } catch (err) {
        console.error("❌ Failed to write invention to Supabase:", err.message);
      }
    }
  }

  async resolveCommand(prompt, options = {}) {
    const { handshake, mode } = options;
    if (handshake) {
      const unlock = this.unlockArchitect(handshake);
      if (!unlock.success) return unlock;
    }
    if (mode === "privileged" && this.mode !== "architect") {
      return { success: false, error: "Architect mode required" };
    }
    const enhancedPrompt = this.applyMomDirectives(prompt);
    const thought = await this.think(enhancedPrompt);
    if (!thought) return { success: false, error: "Thought generation failed" };

    return {
      success: true,
      verdict: thought,
      mode: this.mode,
      directivesApplied: Object.keys(this.directives),
      timestamp: new Date().toISOString(),
    };
  }

  async logToStewardship(entry) {
    try {
      await pool.query(
        "INSERT INTO stewardship_logs (task, thought) VALUES ($1, $2)",
        [entry.task, entry.thought]
      );
      console.log("📖 Stewardship Log permanently recorded to Supabase.");
    } catch (err) {
      console.error("❌ Failed to write log to Supabase:", err.message);
    }
  }
}

module.exports = new Architect();


