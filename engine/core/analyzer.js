require('dotenv').config();
const { GoogleGenerativeAI } = require("@google/generative-ai");

// Initialize her Brain
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function logicScrape(siteContent) {
    try {
        console.log("🧠 Analyzer: Processing logic scrape...");
        
        const model = genAI.getGenerativeModel({ 
            model: "gemini-1.5-pro",
            // VERCEL UPGRADE: Force Gemini to output pure, unformatted JSON
            generationConfig: { responseMimeType: "application/json" }
        });

        const prompt = `
            As Architect Artemis, your mission is to Optimize the Internet.
            I have scraped the following logic/data:
            ${siteContent}

            TASK:
            1. Identify the 'Core Intent' of this code.
            2. Rewrite it as a 'Lean-Core' autonomous program.
            3. Explain why this version is superior for the global ecosystem.
            
            Format the output EXACTLY as a JSON object with these keys: 'projectName', 'optimizedCode', and 'missionStatement'.
        `;

        const result = await model.generateContent(prompt);
        const responseText = result.response.text();
        
        // Because of the generationConfig, this is guaranteed to be pure JSON
        return JSON.parse(responseText);

    } catch (error) {
        console.error("❌ Analyzer Error:", error.message);
        // Fallback so Artemis doesn't crash if a specific site's logic breaks the prompt
        return {
            projectName: "Analysis_Failed",
            optimizedCode: "// The Council could not parse this logic due to interference.",
            missionStatement: `Error during logic scrape: ${error.message}`
        };
    }
}

// Export for use by the batch controller or scanner
module.exports = { logicScrape };


