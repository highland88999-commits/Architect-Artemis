// frontend/src/lib/ArtemisBrain.js
import init, { 
    artemis_brain_alloc, 
    artemis_brain_load_weights,
    artemis_brain_infer,
    memory 
} from '../wasm/artemis_voice.js';

class NativeNeuralMatrix {
    constructor() {
        this.isInitialized = false;
        this.matrixPtr = null;
    }

    async initialize() {
        if (this.isInitialized) return;
        await init();
        
        this.matrixPtr = artemis_brain_alloc();
        
        console.log("🧠 Fetching Neural Weights (model.bin)...");
        // Ensure you have downloaded a tiny open-source model (like stories15M.bin)
        // and placed it in your frontend/public/ folder as 'model.bin'
        try {
            const res = await fetch('/model.bin'); 
            const buffer = await res.arrayBuffer();
            const weights = new Uint8Array(buffer);
            
            // Allocate WASM memory and copy the weights in
            const dataPtr = this.allocBuffer(weights);
            artemis_brain_load_weights(this.matrixPtr, dataPtr, weights.length);
            
            console.log("✅ Artemis Native Brain Online.");
            this.isInitialized = true;
        } catch (e) {
            console.error("⚠️ Failed to load model.bin. Ensure it is in the public/ folder.", e);
        }
    }

    async think(promptText, maxTokens = 50) {
        if (!this.isInitialized) await this.initialize();

        const encoder = new TextEncoder();
        const textBytes = encoder.encode(promptText);
        
        const textPtr = this.allocBuffer(textBytes);
        const outLenPtr = this.allocUsize();

        const resultPtr = artemis_brain_infer(
            this.matrixPtr, 
            textPtr, 
            textBytes.length, 
            maxTokens,
            outLenPtr
        );

        const resultLen = new Uint32Array(memory.buffer, outLenPtr, 1)[0];
        const resultData = new Uint8Array(memory.buffer, resultPtr, resultLen);
        
        const decoder = new TextDecoder();
        return decoder.decode(resultData);
    }

    allocBuffer(bytes) {
        const ptr = new Uint8Array(memory.buffer).byteLength - bytes.length - 100;
        new Uint8Array(memory.buffer, ptr, bytes.length).set(bytes);
        return ptr;
    }

    allocUsize() {
        return new Uint8Array(memory.buffer).byteLength - 8;
    }
}

export const ArtemisBrain = new NativeNeuralMatrix();
