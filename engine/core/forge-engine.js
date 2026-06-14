/* engine/core/forge-engine.js */
const consensus = require('./consensus');
const deployment = require('./deploy-bridge');

class ForgeEngine {
    async createApp(prompt, identity, appName) {
        console.log(`🔨 Artemis: Forging app '${appName}' for ${identity}...`);
        
        try {
            // 🚨 SAFETY CHECK: Ensure the method actually exists in consensus.js
            if (typeof consensus.evaluateAppPrompt !== 'function') {
                throw new Error("Missing 'evaluateAppPrompt' method in consensus.js. Please add it to the Council engine!");
            }

            // 1. Council Synthesis: Generate the App Blueprint
            const appStructure = await consensus.evaluateAppPrompt(prompt, identity);
            
            // 2. Code Generation: Artemis writes the index.html and logic.js
            // Added fallbacks just in case the AI council misses a specific file string
            const files = {
                'index.html': appStructure.html || '<h1>Artemis Forge: Awaiting Code</h1>',
                'style.css': appStructure.css || 'body { font-family: sans-serif; background: #000; color: #fff; }',
                'script.js': appStructure.js || 'console.log("Artemis Forge Initialized.");',
                'README.md': `# ${appName}\nCreated by Artemis Forge for ${identity}.`
            };

            // 3. Deployment: Push to a free domain provider (e.g., Vercel)
            const deploymentResult = await deployment.deployToFreeDomain(appName, files);

            if (deploymentResult.error) {
                console.error("❌ App Forging Failed during deployment.");
                return { success: false, error: deploymentResult.error };
            }

            console.log(`✨ App Forged Successfully: ${deploymentResult.url}`);
            
            return {
                success: true,
                url: deploymentResult.url,
                // Note: deployToFreeDomain doesn't currently return a repoUrl, so we fall back gracefully
                repo: deploymentResult.repoUrl || 'Direct Vercel Deployment (No Repo)' 
            };

        } catch (error) {
            console.error(`❌ Forge Engine Error:`, error.message);
            return {
                success: false,
                error: error.message
            };
        }
    }
}

module.exports = new ForgeEngine();


