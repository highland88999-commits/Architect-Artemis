/**
 * Artemis Synaptic Bridge
 * Connects the Vercel Node.js Server to the Render Python Matrix
 */

// Uses the Render URL if defined in Vercel, otherwise defaults to your specific URL
const PYTHON_API_URL = process.env.PYTHON_ENGINE_URL || "https://architect-artemis.onrender.com";

/**
 * Sends text to the Render ML Node for Sentiment Analysis (PyTorch/Transformers)
 */
async function triggerSentimentAnalysis(text) {
    try {
        console.log("🧠 Routing data to Python ML Node...");
        const response = await fetch(`${PYTHON_API_URL}/analyze/sentiment`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: text })
        });

        if (!response.ok) {
            throw new Error(`Python Engine Error: ${response.statusText}`);
        }

        const data = await response.json();
        return data; // Returns { success, label, score }
    } catch (error) {
        console.error("❌ Synaptic Bridge Failed (ML Node):", error);
        return { success: false, error: error.message };
    }
}

/**
 * Sends a command to the Render Quantum Learner (QuTiP)
 */
async function triggerQuantumSimulation(operationType) {
    try {
        console.log(`🌌 Routing quantum calculation (${operationType}) to Python Node...`);
        const response = await fetch(`${PYTHON_API_URL}/quantum/simulate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ operation: operationType })
        });

        if (!response.ok) {
            throw new Error(`Python Engine Error: ${response.statusText}`);
        }

        const data = await response.json();
        return data; // Returns { success, operation, state_matrix }
    } catch (error) {
        console.error("❌ Synaptic Bridge Failed (Quantum Node):", error);
        return { success: false, error: error.message };
    }
}

module.exports = {
    triggerSentimentAnalysis,
    triggerQuantumSimulation
};

