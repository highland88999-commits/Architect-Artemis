/**
 * ARCHITECT ARTEMIS | CONSENSUS ENGINE
 * Purpose: Aggregating Gemini, Copilot, and Grok via Clarifai.
 */

const { ClarifaiStub, grpc } = require("clarifai-nodejs-grpc");
const stub = ClarifaiStub.grpc();
const metadata = new grpc.Metadata();
metadata.set("authorization", "Key " + process.env.CLARIFAI_PAT);

class ConsensusEngine {
    constructor() {
        this.models = [
            { name: 'Copilot', id: 'gpt-4', user: 'openai', app: 'chat-completion' },
            { name: 'Grok', id: 'grok-1', user: 'x-ai', app: 'completion' }
        ];
    }

    async askCouncil(prompt) {
        console.log("🏛️  Artemis: Opening the Council Chamber...");
        
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
                    version_id: "", 
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
