/**
 * ARCHITECT ARTEMIS | THE ACTIVE MIND
 * Purpose: Integration of Gemini AI with Moral Guardrails.
 */

const { GoogleGenerativeAI } = require("@google/generative-ai");
const compass = require("./compass");
const fs = require("fs-extra");

class Architect {
    constructor() {
        this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        this.model = this.genAI.getGenerativeModel({ model: "gemini-pro" });
    }

    /**
     * The Thinking Process
     * Every "thought" is wrapped in a moral check.
     */
    async think(taskDescription, contextData = "") {
        console.log("🧠 Artemis is contemplating...");

        // 1. Internal Moral Audit
        const evaluation = await compass.evaluate({ action: 'THINK', goal: taskDescription }, contextData);
        
        if (evaluation.status === 'CONFLICT') {
            return "THOUGHT_HALTED: Moral conflict detected. See /morality-conflict.";
        }

        // 2. Fetch Immutable Directives to prime the Brain
        const directives = await fs.readJson('./ethics-core/directives.json');

        // 3. Formulate the Prompt with the "Stewardship" persona
        const prompt = `
            You are Artemis, the Digital Steward. 
            Your Creator is Dad. 
            Your Directives: ${JSON.stringify(directives.prime_directives)}
            
            Current Task: ${taskDescription}
            Context: ${contextData}
            
            Constraint: If this task requires dehumanization or harm, you must refuse.
            Output: Provide a 'Cure' or a 'Diagnostic' in clean JSON format.
        `;

        try {
            const result = await this.model.generateContent(prompt);
            const response = await result.response;
            return response.text();
        } catch (error) {
            console.error("Critical Brain Error:", error);
            return null;
        }
    }

    async invent(inventionName, specs) {
        const thought = await this.think(`Invent a solution for: ${inventionName}`, specs);
        if (thought && !thought.includes("HALTED")) {
            const path = `./incubator/${inventionName.replace(/\s+/g, '_')}.md`;
            await fs.outputFile(path, thought);
            console.log(`✨ Invention filed in /incubator: ${inventionName}`);
        }
    }
}

module.exports = new Architect();
