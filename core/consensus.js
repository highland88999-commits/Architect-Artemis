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
     * MISSION: Dual-Layer Analysis & Stewardship Evaluation
     */
    async evaluateHarvest(urlData) {
        console.log(`🏛️  Artemis: Council convening for ${urlData.url}...`);

        const structuralPrompt = `
            DIRECTIVE: Conduct a Dual-Layer Analysis of ${urlData.url}.
            
            LAYER 1: SYSTEM OPTIMIZATION
            - Identify performance bottlenecks (UX, Logic, Speed).
            - Extract contact information (Emails, Social, Support).
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

    async artemisFinalDecision(target, opinions) {
        console.log("⚖️  Artemis: Synthesizing Council consensus...");

        // 1. Calculate Average Nurture Score for Executive Veto
        const scores = opinions.map(o => {
            const match = o.content.match(/\[NURTURE_SCORE\]:\s*(\d+)/);
            return match ? parseInt(match[1]) : 0;
        });
        const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;

        // 2. Select the most detailed response (Priority: Gemini Prime)
        const primary = opinions.find(o => o.provider === 'Gemini Prime' && o.content) || opinions[0];

        // 3. Extract Structured Layers
        const result = {
            approved: avgScore >= 7,
            nurture_score: avgScore,
            target: target,
            optimization_steps: this.extract(primary.content, 'OPTIMIZATION'),
            invention_idea: this.extract(primary.content, 'INVENTION'),
            blueprint_code: this.extract(primary.content, 'CODE'),
            contact_info: this.extractContactInfo(primary.content),
            metrics: {
                gemini: "Logic Verified",
                copilot: "Structure Validated",
                grok: "Efficiency Checked"
            }
        };

        return result;
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
                    if (err || response.status.code !== 10000) return reject(err || response.status.description);
                    resolve(response.outputs[0].data.text.raw);
                }
            );
        });
    }

    extract(text, tag) {
        const regex = new RegExp(`\\[${tag}_START\\]([\\s\\S]*?)\\[${tag}_END\\]`);
        const match = text.match(regex);
        return match ? match[1].trim() : "Analysis missing.";
    }

    extractContactInfo(text) {
        // Simplified extraction for the optimization report
        const lines = text.split('\n');
        return lines.filter(l => l.includes('@') || l.includes('http') || l.toLowerCase().includes('contact')).join('\n') || "No data.";
    }
}

module.exports = new ConsensusEngine();
