/* engine/core/stewardship/consensus.js */
require('dotenv').config();
const { pool } = require('../atlas-db'); // Your Supabase connection
const MidasLogger = require('./midas-logger');
const Mailer = require('./mailer'); // The automated email pipeline

// Graceful Clarifai initialization
let stub, metadata;
const CLARIFAI_AVAILABLE = process.env.CLARIFAI_PAT && process.env.CLARIFAI_PAT !== 'optional-for-local-dev';

if (CLARIFAI_AVAILABLE) {
  try {
    const { ClarifaiStub, grpc } = require("clarifai-nodejs-grpc");
    stub = ClarifaiStub.grpc();
    metadata = new grpc.Metadata();
    metadata.set("authorization", "Key " + process.env.CLARIFAI_PAT);
    console.log("✓ Clarifai Council initialized");
  } catch (err) {
    console.warn("⚠️ Clarifai initialization failed:", err.message);
  }
} else {
  console.log("ℹ️ Running without Clarifai Council (local dev mode)");
}

class ConsensusEngine {
  constructor() {
    this.models = [
      { name: "Gemini Prime", id: "gemini-1-5-pro", user: "google", app: "generative-ai" },
      { name: "Copilot Beta", id: "gpt-4", user: "openai", app: "chat-completion" },
      { name: "Grok X", id: "grok-1", user: "x-ai", app: "completion" },
    ];
    this.clarifaiAvailable = CLARIFAI_AVAILABLE;
  }

  /**
   * MISSION: Dual-Layer Analysis & Stewardship Evaluation
   */
  async evaluateHarvest(urlData) {
    console.log(`🏛️ Artemis: Council convening for ${urlData.url}...`);

    const structuralPrompt = `
      DIRECTIVE: Conduct a Dual-Layer Analysis of ${urlData.url}.
      
      LAYER 1: SYSTEM OPTIMIZATION
      - Identify performance bottlenecks.
      - Extract contact information.
      - Provide 3 actionable structural improvements.

      LAYER 2: SYNTHETIC INVENTION
      - Invent a NEW technology or code blueprint inspired by this site.
      - Must adhere to the "NURTURE" directive (growth-oriented).

      VALUATION:
      - Provide a Nurture Score (1-10) based on constructive potential.

      OUTPUT FORMAT:
      [NURTURE_SCORE]: (Number)
      [OPTIMIZATION_START] (Report) [OPTIMIZATION_END]
      [INVENTION_START] (Concept) [INVENTION_END]
      [CODE_START] (Blueprint) [CODE_END]
    `;

    const councilOpinions = await this.askCouncil(structuralPrompt);
    return this.artemisFinalDecision(urlData, councilOpinions);
  }

  /**
   * Sequential Council call (used by architect.js resolveCommand)
   */
  async speakSequentially(prompt) {
    console.log(`Council: speakSequentially called with prompt: ${prompt.slice(0, 100)}...`);

    const responses = [];
    for (const model of this.models) {
      try {
        const result = await this.fetchClarifai(model, prompt);
        responses.push({
          agent: model.name,
          response: result,
        });
        console.log(`${model.name} responded.`);
      } catch (err) {
        console.error(`${model.name} failed:`, err.message);
        responses.push({
          agent: model.name,
          response: "Agent offline",
          error: err.message,
        });
      }
    }

    // Synthesize final verdict
    const combined = responses
      .map(r => r.response)
      .filter(Boolean)
      .join("\n\n");

    return {
      agents: responses.map(r => r.agent),
      combinedVerdict: combined || "No responses from Council.",
      timestamp: new Date().toISOString(),
      status: responses.some(r => r.error) ? "partial" : "complete",
    };
  }

  /**
   * Final Decision & Autonomous Midas Tripwire
   */
  async artemisFinalDecision(target, opinions) {
    console.log("⚖️ Artemis: Synthesizing Council consensus...");

    const scores = opinions.map(o => {
      const match = o.content?.match(/\[NURTURE_SCORE\]:\s*(\d+)/);
      return match ? parseInt(match[1]) : 0;
    });
    
    const avgScore = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
    const primary = opinions.find(o => o.provider === "Gemini Prime" && o.content && !o.content.includes("Connection Failed")) || opinions[0];

    const isSuboptimal = avgScore < 7; // The failure threshold
    
    // Construct the result object FIRST so the Mailer has access to the data
    const result = {
      approved: !isSuboptimal,
      nurture_score: avgScore,
      target: target,
      optimization_steps: this.extract(primary.content, "OPTIMIZATION"),
      invention_idea: this.extract(primary.content, "INVENTION"),
      blueprint_code: this.extract(primary.content, "CODE"),
      contact_info: this.extractContactInfo(primary.content),
      metrics: {
        gemini: "Logic Verified",
        copilot: "Structure Validated",
        grok: "Efficiency Checked",
      }
    };
    
    // --- MIDAS WATCHDOG TRIPWIRE & AUTOMATED SALES PIPELINE ---
    if (isSuboptimal) {
        console.warn(`🚨 Midas Tripwire: Nurture Score (${avgScore}) below threshold. Initiating Stewardship...`);
        
        const interventionData = {
            context: `Target: ${target.url} failed with score ${avgScore}`,
            error: "Suboptimal Nurture Potential",
            guidance: result.optimization_steps,
            new_target: "system://growth-re-routing"
        };

        try {
            // 1. Log to DB (Permanent Record)
            await MidasLogger.logIntervention(interventionData);
            
            // 2. Set the "Tripwire" in Supabase so the frontend sees it
            await pool.query(
                "UPDATE midas_status SET trigger_intervention = true, lost_id = $1, target_id = $2, latest_guidance = $3 WHERE id = 1",
                [target.url, "growth-re-routing", result.optimization_steps]
            );

            // 3. Email the internal Architect Report
            await Mailer.notifyArchitect(target.url, result);

            // 4. Extract Owner Email and Pitch (Currently disabled for safety)
            const ownerEmailMatch = result.contact_info.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9._-]+)/gi);
            if (ownerEmailMatch && ownerEmailMatch.length > 0) {
                const ownerEmail = ownerEmailMatch[0];
                console.log(`✉️ Found Site Owner Email: ${ownerEmail} - Pitch ready to deploy.`);
                
                // UNCOMMENT the line below when you are ready to auto-email site owners!
                // await Mailer.pitchSiteOwner(ownerEmail, target.url, result); 
            }

        } catch (error) {
            console.error("❌ Failed to execute Midas Tripwire sequence:", error.message);
        }
    }
    // --------------------------------

    return result;
  }

  async askCouncil(prompt) {
    const promises = this.models.map(m => this.fetchClarifai(m, prompt));
    const responses = await Promise.allSettled(promises);
    return responses.map((res, i) => ({
      provider: this.models[i].name,
      content: res.status === "fulfilled" ? res.value : "Connection Failed.",
    }));
  }

  fetchClarifai(model, prompt) {
    if (!this.clarifaiAvailable || !stub) return Promise.reject(new Error("Clarifai unavailable."));
    return new Promise((resolve, reject) => {
      stub.PostModelOutputs(
        {
          user_app_id: { user_id: model.user, app_id: model.app },
          model_id: model.id,
          inputs: [{ data: { text: { raw: prompt } } }],
        },
        metadata,
        (err, response) => {
          if (err || response?.status?.code !== 10000) return reject(err || response?.status?.description);
          resolve(response.outputs[0].data.text.raw);
        }
      );
    });
  }

  extract(text, tag) {
    if (!text) return "Analysis missing.";
    const regex = new RegExp(`\\[${tag}_START\\]([\\s\\S]*?)\\[${tag}_END\\]`);
    const match = text.match(regex);
    return match ? match[1].trim() : "Analysis missing.";
  }

  extractContactInfo(text) {
    if (!text) return "No data.";
    return text.split("\n").filter(l => l.includes("@") || l.includes("http") || l.toLowerCase().includes("contact")).join("\n") || "No direct contact data harvested.";
  }
}

module.exports = new ConsensusEngine();


