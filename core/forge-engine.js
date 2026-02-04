/* core/forge-engine.js */
const consensus = require('./consensus');
const deployment = require('./deploy-bridge');

class ForgeEngine {
    async createApp(prompt, identity, appName) {
        console.log(`🔨 Artemis: Forging app '${appName}' for ${identity}...`);
        
        // 1. Council Synthesis: Generate the App Blueprint
        const appStructure = await consensus.evaluateAppPrompt(prompt, identity);
        
        // 2. Code Generation: Artemis writes the index.html and logic.js
        const files = {
            'index.html': appStructure.html,
            'style.css': appStructure.css,
            'script.js': appStructure.js,
            'README.md': `# ${appName}\nCreated by Artemis Forge for ${identity}.`
        };

        // 3. Deployment: Push to a free domain provider (e.g., Vercel)
        const deploymentResult = await deployment.deployToFreeDomain(appName, files);

        return {
            success: true,
            url: deploymentResult.url,
            repo: deploymentResult.repoUrl
        };
    }
}

module.exports = new ForgeEngine();
