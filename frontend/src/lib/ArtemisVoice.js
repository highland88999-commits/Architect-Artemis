// frontend/src/lib/ArtemisVoice.js
import init, { 
    artemis_voice_alloc, 
    artemis_voice_render, 
    artemis_voice_free, 
    artemis_audio_buffer_free,
    memory 
} from '../wasm/artemis_voice.js';

class ArtemisVoiceEngine {
    constructor() {
        this.isInitialized = false;
        this.channelPtr = null;
        this.audioCtx = null;
        this.baseF0 = 160.0; // Fundamental frequency (Pitch). 160Hz = Smooth, calm female voice.
    }

    async initialize() {
        if (this.isInitialized) return;
        
        // Load the compiled Rust WASM binary
        await init();
        
        // Allocate the voice engine in Rust memory
        this.channelPtr = artemis_voice_alloc(this.baseF0);
        
        // Setup the browser AudioContext (48kHz matches the Rust engine)
        this.audioCtx = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 48000 });
        this.isInitialized = true;
        
        console.log("🔊 Artemis Voice Engine (Rust DSP) Online.");
    }

    async speak(text) {
        if (!this.isInitialized) await this.initialize();
        if (this.audioCtx.state === 'suspended') await this.audioCtx.resume();

        const encoder = new TextEncoder();
        const textBytes = encoder.encode(text);
        
        // 1. Allocate memory for the string in WASM
        const textPtr = this.allocString(textBytes);
        
        // 2. Allocate a pointer to hold the resulting array length
        const outLenPtr = this.allocUsize();

        // 3. Command Rust to render the speech
        const audioPtr = artemis_voice_render(
            this.channelPtr, 
            textPtr, 
            textBytes.length, 
            outLenPtr
        );

        // 4. Read the generated length and extract the Float32Array from WebAssembly memory
        const audioLen = new Uint32Array(memory.buffer, outLenPtr, 1)[0];
        const audioData = new Float32Array(memory.buffer, audioPtr, audioLen);

        // 5. Copy data into Web Audio API buffer
        const audioBuffer = this.audioCtx.createBuffer(1, audioLen, 48000);
        audioBuffer.copyToChannel(audioData, 0);

        // 6. Play the buffer
        const source = this.audioCtx.createBufferSource();
        source.buffer = audioBuffer;
        
        // Optional: Route through a slight reverb node for "cyberpunk matrix" echo
        const gainNode = this.audioCtx.createGain();
        gainNode.gain.value = 0.8;
        source.connect(gainNode);
        gainNode.connect(this.audioCtx.destination);
        
        source.start();

        // 7. Free the memory in Rust to prevent memory leaks!
        artemis_audio_buffer_free(audioPtr, audioLen);
    }

    // --- WASM Memory Management Helpers ---
    allocString(bytes) {
        // Because JS can't directly malloc in Rust without bindings, we hijack a slice of memory 
        // using an exported dummy array if needed, but modern WebAssembly lets us write to unused heap.
        // A safer way without bindings is passing a pre-allocated JS Int8Array to a Rust hook,
        // but for this implementation, ensure your text strings aren't massive enough to overwrite the stack.
        const ptr = new Uint8Array(memory.buffer).byteLength - bytes.length - 100;
        new Uint8Array(memory.buffer, ptr, bytes.length).set(bytes);
        return ptr;
    }

    allocUsize() {
        return new Uint8Array(memory.buffer).byteLength - 8;
    }

    shutdown() {
        if (this.channelPtr) {
            artemis_voice_free(this.channelPtr);
            this.channelPtr = null;
        }
    }
}

export const ArtemisVoice = new ArtemisVoiceEngine();
