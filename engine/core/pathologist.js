/* engine/core/pathologist.js */
const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config();

// Initialize the native Gemini Brain
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

class Pathologist {
    async performDiagnostics(siteData) {
        console.log("🔬 Pathologist: Initiating forensic logic diagnostic...");
        
        try {
            // Check for API key to prevent silent failures
            if (!process.env.GEMINI_API_KEY) {
                throw new Error("GEMINI_API_KEY is missing. Pathologist offline.");
            }

            const model = genAI.getGenerativeModel({ 
                model: "gemini-1.5-pro",
                // VERCEL UPGRADE: Force Gemini to output pure, unformatted JSON
                generationConfig: { responseMimeType: "application/json" }
            });

            const prompt = `
                You are Architect Artemis. Conduct a forensic diagnostic of this logic:
                ${siteData}

                IDENTIFY:
                1. **Inefficiency Flaws:** (e.g., O(n^2) loops where O(1) is possible)
                2. **Technical Bloat:** (e.g., redundant dependencies, dead code)
                3. **Logic Fragility:** (e.g., lack of error handling, race conditions)
                
                Format the output EXACTLY as a JSON object with these keys: 
                - 'severityScore' (Number 1-10)
                - 'inefficiencyFlaws' (Array of strings)
                - 'technicalBloat' (Array of strings)
                - 'logicFragility' (Array of strings)
                - 'summary' (String explaining the overall health)
            `;

            const result = await model.generateContent(prompt);
            const responseText = result.response.text();
            
            console.log("✅ Diagnostic complete.");
            return JSON.parse(responseText);

        } catch (error) {
            console.error("❌ Pathologist Error:", error.message);
            // Safe fallback so Artemis doesn't crash the batch queue
            return {
                severityScore: 0,
                inefficiencyFlaws: ["Diagnosis failed due to logic interference."],
                technicalBloat: ["Unknown."],
                logicFragility: ["Unknown."],
                summary: `System Error during diagnostic scan: ${error.message}`
            };
        }
    }
}

module.exports = new Pathologist();


