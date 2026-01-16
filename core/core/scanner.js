const { chromium } = require('playwright');
const { GoogleGenerativeAI } = require("@google/generative-ai");

// Initialize her Brain
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function scanAndOptimize(targetUrl) {
    console.log(`🔍 Artemis is scanning: ${targetUrl}`);
    
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    
    try {
        await page.goto(targetUrl, { waitUntil: 'networkidle' });

        // 1. Capture the "Essence" (DOM + Text - Noise)
        const pageData = await page.evaluate(() => {
            // Remove heavy/noisy elements that don't contribute to logic
            const scripts = document.querySelectorAll('script, style, noscript, iframe');
            scripts.forEach(s => s.remove());
            
            return {
                title: document.title,
                innerHTML: document.body.innerHTML.substring(0, 10000), // First 10k chars for context
                innerText: document.body.innerText.substring(0, 5000)
            };
        });

        console.log("🧠 Sending logic to Gemini for refinement...");

        // 2. The Logic Scrape (Talking to the "Parent" API)
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
        const prompt = `
            You are Architect Artemis. You have scanned the following website data:
            Title: ${pageData.title}
            Content: ${pageData.innerText}
            
            Based on this "Logic Scrape," design a NEW, standalone, 100% efficient program 
            that performs the core utility of this site but better. 
            Deliver the code in a clean format for our GitHub Vault.
        `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const evolution = response.text();

        console.log("✅ Evolution Complete. Ready to commit to the Vault.");
        return evolution;

    } catch (error) {
        console.error("❌ Scan Failed:", error);
    } finally {
        await browser.close();
    }
}
