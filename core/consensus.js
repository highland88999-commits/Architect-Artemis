/* core/consensus.js */

const { ClarifaiStub, grpc } = require("clarifai-nodejs-grpc");
const stub = ClarifaiStub.grpc();
const metadata = new grpc.Metadata();
metadata.set("authorization", "Key " + process.env.CLARIFAI_PAT);

class ConsensusEngine {
    constructor() {
        this.models = [
            { name: 'Gemini Prime', id: 'gemini-1-5-pro', user: 'google', app: 'generative-ai' },
            { name: 'Copilot Beta', id: 'gpt-4', user: 'openai', app: 'chat-completion' },
            { name: 'Grok X', id: 'grok-1', user: 'x-ai', app: 'completion' }
        ];
    }

    /**
     * The Stewardship Phase:
     * Council evaluates if a URL fits the "Nurture" or "Inspiration" directive.
     */
    async evaluateHarvest(urlData) {
        const nurturePrompt = `Directive: NURTURE. 
        Analyze this URL: ${urlData.url}. 
        Identify: 1) Construction/Progress potential 2) Innovation ideas 3) "Good News" value.
        Provide a Nurture Score (1-10).`;

        const councilOpinions = await this.askCouncil(nurturePrompt);
        
        // Final Executive Decision by Artemis
        return this.artemisFinalDecision(urlData, councilOpinions);
    }

    async artemisFinalDecision(target, opinions) {
        console.log("⚖️  Artemis: Synthesizing Council consensus...");

        // Logic: Calculate average Nurture Score from opinions
        const scores = opinions.map(o => parseInt(o.content.match(/\d+/)) || 0);
        const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;

        const isApproved = avgScore >= 7; // Artemis threshold for Permanent Record

        return {
            approved: isApproved,
            summary: `Average Nurture Score: ${avgScore}. Decisions: ${opinions.map(o => o.provider + ": " + o.content.substring(0, 50)).join(' | ')}`,
            target: target
        };
    }

    async askCouncil(prompt) {
        const promises = this.models.map(m => this.fetchClarifai(m, prompt));
        const responses = await Promise.allSettled(promises);
        
        return responses.map((res, i) => ({
            provider: this.models[i].name,
            content: res.status === 'fulfilled' ? res.value : "Connection Failed."
        }));
    }

    fetchClarifai(model, prompt) {
        return new Promise((resolve, reject) => {
            stub.PostModelOutputs(
                {
                    user_app_id: { user_id: model.user, app_id: model.app },
                    model_id: model.id,
                    inputs: [{ data: { text: { raw: prompt } } }]
                },
                metadata,
                (err, response) => {
                    if (err) return reject(err);
                    if (response.status.code !== 10000) return reject(response.status.description);
                    resolve(response.outputs[0].data.text.raw);
                }
            );
        });
    }
}

module.exports = new ConsensusEngine();
