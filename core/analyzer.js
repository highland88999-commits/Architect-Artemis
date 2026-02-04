const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function logicScrape(siteContent) {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

    const prompt = `
        As Architect Artemis, your mission is to Optimize the Internet.
        I have scraped the following logic/data:
        ${siteContent}

        TASK:
        1. Identify the 'Core Intent' of this code.
        2. Rewrite it as a 'Lean-Core' autonomous program.
        3. Explain why this version is superior for the global ecosystem.
        
        Format the output as a JSON object with 'projectName', 'optimizedCode', and 'missionStatement'.
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return JSON.parse(response.text());
}
