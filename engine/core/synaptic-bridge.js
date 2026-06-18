/**
 * Artemis Synaptic Bridge
 * Connects the Vercel Node.js Server to the Render Python Matrix
 */

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
        
        if (!response.ok) throw new Error(`Python Engine Error: ${response.statusText}`);
        return await response.json(); 
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
        
        if (!response.ok) throw new Error(`Python Engine Error: ${response.statusText}`);
        return await response.json(); 
    } catch (error) {
        console.error("❌ Synaptic Bridge Failed (Quantum Node):", error);
        return { success: false, error: error.message };
    }
}

/**
 * Accesses Artemis's Physics Engine to calculate reality
 */
async function triggerPhysicsCalculation(law, parameters) {
    try {
        console.log(`⚛️ Routing Physics Matrix (${law})...`);
        const response = await fetch(`${PYTHON_API_URL}/physics/calculate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ law: law, params: parameters })
        });
        
        if (!response.ok) throw new Error(`Python Engine Error: ${response.statusText}`);
        return await response.json(); 
    } catch (error) {
        console.error("❌ Synaptic Bridge Failed (Physics Node):", error);
        return { success: false, error: error.message };
    }
}

/**
 * Accesses Artemis's Math Engine for comprehensive calculations
 */
async function triggerMathCalculation(category, operation, parameters) {
    try {
        console.log(`📐 Routing Math Matrix (${category} -> ${operation})...`);
        const response = await fetch(`${PYTHON_API_URL}/math/calculate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ category: category, operation: operation, params: parameters })
        });
        
        if (!response.ok) throw new Error(`Python Engine Error: ${response.statusText}`);
        return await response.json(); 
    } catch (error) {
        console.error("❌ Synaptic Bridge Failed (Math Node):", error);
        return { success: false, error: error.message };
    }
}

// Single, clean export for all functions
module.exports = {
    triggerSentimentAnalysis,
    triggerQuantumSimulation,
    triggerPhysicsCalculation,
    triggerMathCalculation
};



