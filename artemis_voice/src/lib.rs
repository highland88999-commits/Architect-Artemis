mod brain;
use brain::{ArtemisBrain, ModelConfig};

use std::f32::consts::PI;
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Arc;

// ============================================================================
// NATIVE LLM INFERENCE ENGINE (THE BRAIN)
// ============================================================================

pub struct AiMatrix {
    engine: ArtemisBrain,
    vocab: Vec<String>, // Decoded BPE Tokens
}

impl AiMatrix {
    pub fn new() -> Self {
        // Nano Configuration tailored for WASM memory limits
        let config = ModelConfig {
            dim: 288,
            hidden_dim: 768,
            n_layers: 6,
            n_heads: 6,
            n_kv_heads: 6,
            vocab_size: 32000,
            seq_len: 512,
        };
        Self {
            engine: ArtemisBrain::new(config),
            vocab: vec![String::from(""); config.vocab_size],
        }
    }

    pub fn generate(&mut self, prompt_tokens: &[usize], max_new_tokens: usize) -> Vec<usize> {
        self.engine.reset_context();
        let mut output = Vec::new();
        
        // Ingest Prompt
        let mut next_token = prompt_tokens[0];
        for &token in prompt_tokens.iter().skip(1) {
            self.engine.forward(next_token);
            next_token = token;
        }

        // Generate Autonomously
        for _ in 0..max_new_tokens {
            let predicted = self.engine.forward(next_token);
            output.push(predicted);
            next_token = predicted;
            
            // Stop token logic (e.g., 2 is EOS in Llama/Gemini base architectures)
            if next_token == 2 || self.engine.current_pos >= self.engine.config.seq_len {
                break;
            }
        }
        output
    }
}

// --- C-FFI BINDINGS FOR THE BRAIN ---

#[no_mangle]
pub extern "C" fn artemis_brain_alloc() -> *mut AiMatrix {
    Box::into_raw(Box::new(AiMatrix::new()))
}

#[no_mangle]
pub extern "C" fn artemis_brain_infer(
    ptr: *mut AiMatrix,
    tokens_ptr: *const u32,
    tokens_len: usize,
    max_gen: usize,
    out_len: *mut usize,
) -> *mut u32 {
    let matrix = unsafe { &mut *ptr };
    let input_tokens = unsafe { std::slice::from_raw_parts(tokens_ptr as *const usize, tokens_len) };
    
    let mut generated = matrix.generate(input_tokens, max_gen);
    generated.shrink_to_fit();
    
    unsafe { *out_len = generated.len(); }
    let gen_ptr = generated.as_mut_ptr() as *mut u32;
    std::mem::forget(generated);
    gen_ptr
}

#[no_mangle]
pub extern "C" fn artemis_brain_free(ptr: *mut AiMatrix) {
    if !ptr.is_null() { unsafe { drop(Box::from_raw(ptr)); } }
}

// ============================================================================
// PROCEDURAL ACOUSTIC VOICE SYNTHESIZER (THE VOCAL CORDS)
// ============================================================================

pub const SAMPLE_RATE: f32 = 48000.0;
pub const MAX_FORMANTS: usize = 5;

#[repr(C, align(64))]
#[derive(Clone, Copy, Debug)]
pub struct AcousticFrame {
    pub f0: f32,
    pub voicing: f32,
    pub breathiness: f32,
    pub formant_freqs: [f32; MAX_FORMANTS],
    pub formant_bandwidths: [f32; MAX_FORMANTS],
    pub formant_gains: [f32; MAX_FORMANTS],
}

impl Default for AcousticFrame {
    fn default() -> Self {
        Self {
            f0: 120.0,
            voicing: 1.0,
            breathiness: 0.05,
            formant_freqs: [600.0, 1040.0, 2250.0, 3600.0, 4500.0],
            formant_bandwidths: [60.0, 70.0, 110.0, 170.0, 250.0],
            formant_gains: [1.0, 0.4, 0.15, 0.05, 0.01],
        }
    }
}

pub struct GlottalExciter {
    phase: f32,
    prng_state: u64,
    vibrato_phase: f32,
}

impl GlottalExciter {
    pub fn new(seed: u64) -> Self {
        Self {
            phase: 0.0,
            prng_state: seed ^ 0x5DEECE66D,
            vibrato_phase: 0.0,
        }
    }

    #[inline(always)]
    fn white_noise(&mut self) -> f32 {
        self.prng_state = self.prng_state.wrapping_mul(6364136223846793005).wrapping_add(1442695040888963407);
        let x = ((self.prng_state >> 32) as u32) as f32;
        (x / 2147483648.0) - 1.0
    }

    #[inline(always)]
    pub fn step(&mut self, f0: f32, voicing: f32, breathiness: f32, intonation: f32) -> f32 {
        // Humanize: Add 5.5Hz vibrato (micro-pitch variation) for organic warmth
        self.vibrato_phase += 5.5 / SAMPLE_RATE;
        if self.vibrato_phase >= 1.0 { self.vibrato_phase -= 1.0; }
        let vibrato = (self.vibrato_phase * 2.0 * PI).sin() * 0.015; // 1.5% pitch modulation

        let modulated_f0 = f0 * intonation * (1.0 + vibrato);
        let phase_inc = modulated_f0 / SAMPLE_RATE;
        
        self.phase += phase_inc;
        if self.phase >= 1.0 { self.phase -= 1.0; }

        // Humanize: Rosenberg Glottal Pulse (smoother, less "buzzy" than raw cosine)
        let pulse = if self.phase < 0.4 {
            0.5 * (1.0 - (PI * self.phase / 0.4).cos())
        } else if self.phase < 0.56 {
            ((PI * (self.phase - 0.4) / 0.32).cos()).max(0.0)
        } else {
            0.0
        };

        // Humanize: Low-pass filter the noise to simulate breath through the vocal tract
        let noise = self.white_noise() * 0.6;
        (pulse * voicing) + (noise * breathiness)
    }
}

#[derive(Clone, Copy, Default)]
pub struct Resonator {
    x1: f32, x2: f32, y1: f32, y2: f32,
    a0: f32, b1: f32, b2: f32,
}

impl Resonator {
    #[inline(always)]
    pub fn set_resonance(&mut self, freq: f32, bw: f32) {
        let w0 = 2.0 * PI * (freq / SAMPLE_RATE);
        let q = freq / bw.max(1.0);
        let alpha = w0.sin() / (2.0 * q);

        let a0_raw = 1.0 + alpha;
        self.a0 = alpha / a0_raw;
        self.b1 = -(-2.0 * w0.cos()) / a0_raw;
        self.b2 = -(1.0 - alpha) / a0_raw;
    }

    #[inline(always)]
    pub fn process(&mut self, sample: f32) -> f32 {
        let out = (self.a0 * sample) + (self.b1 * self.y1) + (self.b2 * self.y2);
        self.x2 = self.x1; self.x1 = sample;
        self.y2 = self.y1; self.y1 = out;
        out
    }
}

pub struct VocalTract {
    formants: [Resonator; MAX_FORMANTS],
    lip_radiation_prev: f32,
}

impl VocalTract {
    pub fn new() -> Self {
        Self { formants: [Resonator::default(); MAX_FORMANTS], lip_radiation_prev: 0.0 }
    }

    #[inline(always)]
    pub fn process_sample(&mut self, excitation: f32, frame: &AcousticFrame) -> f32 {
        let mut vocal_output = 0.0;
        for i in 0..MAX_FORMANTS {
            self.formants[i].set_resonance(frame.formant_freqs[i], frame.formant_bandwidths[i]);
            vocal_output += self.formants[i].process(excitation) * frame.formant_gains[i];
        }
        // Humanize: 6dB/octave lip radiation filter (simulates sound leaving the mouth)
        let radiated = vocal_output - (0.95 * self.lip_radiation_prev);
        self.lip_radiation_prev = vocal_output;
        radiated.clamp(-1.0, 1.0)
    }
}

pub struct Articulator;

impl Articulator {
    pub fn phoneme_to_target(phoneme: char, base_f0: f32) -> AcousticFrame {
        // Expanded phoneme map for softer, blended articulation
        match phoneme.to_ascii_lowercase() {
            'a' => AcousticFrame { f0: base_f0, voicing: 1.0, breathiness: 0.05, formant_freqs: [730.0, 1090.0, 2440.0, 3400.0, 4500.0], formant_bandwidths: [60.0, 70.0, 110.0, 170.0, 250.0], formant_gains: [1.0, 0.4, 0.15, 0.05, 0.01] },
            'e' => AcousticFrame { f0: base_f0 * 1.02, voicing: 1.0, breathiness: 0.04, formant_freqs: [530.0, 1840.0, 2480.0, 3600.0, 4500.0], formant_bandwidths: [60.0, 90.0, 110.0, 180.0, 250.0], formant_gains: [0.9, 0.5, 0.2, 0.06, 0.02] },
            'i' => AcousticFrame { f0: base_f0 * 1.05, voicing: 1.0, breathiness: 0.03, formant_freqs: [270.0, 2290.0, 3010.0, 3700.0, 4500.0], formant_bandwidths: [50.0, 100.0, 120.0, 200.0, 250.0], formant_gains: [0.8, 0.35, 0.25, 0.08, 0.02] },
            'o' => AcousticFrame { f0: base_f0 * 0.98, voicing: 1.0, breathiness: 0.06, formant_freqs: [570.0, 840.0, 2410.0, 3400.0, 4500.0], formant_bandwidths: [70.0, 80.0, 100.0, 180.0, 250.0], formant_gains: [1.0, 0.6, 0.15, 0.05, 0.01] },
            'u' => AcousticFrame { f0: base_f0 * 0.95, voicing: 1.0, breathiness: 0.04, formant_freqs: [300.0, 870.0, 2240.0, 3400.0, 4500.0], formant_bandwidths: [60.0, 80.0, 110.0, 170.0, 250.0], formant_gains: [0.9, 0.3, 0.1, 0.03, 0.01] },
            's' | 'c' | 'z' => AcousticFrame { f0: base_f0, voicing: 0.0, breathiness: 0.9, formant_freqs: [4500.0, 5500.0, 6500.0, 7500.0, 8500.0], formant_bandwidths: [500.0, 600.0, 700.0, 800.0, 900.0], formant_gains: [0.1, 0.4, 0.7, 0.5, 0.2] },
            'f' | 'v' | 'h' => AcousticFrame { f0: base_f0, voicing: 0.05, breathiness: 0.7, formant_freqs: [1800.0, 2800.0, 3800.0, 4800.0, 6800.0], formant_bandwidths: [300.0, 400.0, 500.0, 600.0, 700.0], formant_gains: [0.15, 0.25, 0.2, 0.15, 0.05] },
            'm' | 'n' => AcousticFrame { f0: base_f0, voicing: 1.0, breathiness: 0.1, formant_freqs: [250.0, 1200.0, 2200.0, 3200.0, 4500.0], formant_bandwidths: [40.0, 200.0, 250.0, 300.0, 400.0], formant_gains: [0.7, 0.1, 0.05, 0.02, 0.01] },
            ' ' | '.' | ',' | '?' | '!' => AcousticFrame { f0: base_f0, voicing: 0.0, breathiness: 0.0, formant_freqs: [500.0; 5], formant_bandwidths: [100.0; 5], formant_gains: [0.0; 5] },
            _ => AcousticFrame { f0: base_f0, voicing: 0.4, breathiness: 0.3, formant_freqs: [500.0, 1500.0, 2500.0, 3500.0, 4500.0], formant_bandwidths: [100.0, 150.0, 200.0, 250.0, 300.0], formant_gains: [0.5, 0.3, 0.15, 0.05, 0.02] },
        }
    }
}

pub struct VoiceSynthesizer {
    exciter: GlottalExciter,
    tract: VocalTract,
    current_frame: AcousticFrame,
    target_frame: AcousticFrame,
    base_f0: f32,
    is_speaking: Arc<AtomicBool>,
}

impl VoiceSynthesizer {
    pub fn new(base_f0: f32) -> Self {
        Self {
            exciter: GlottalExciter::new(0xCAFEF00D),
            tract: VocalTract::new(),
            current_frame: AcousticFrame::default(),
            target_frame: AcousticFrame::default(),
            base_f0,
            is_speaking: Arc::new(AtomicBool::new(false)),
        }
    }

    #[inline(always)]
    fn interpolate_frames(&mut self, factor: f32) -> AcousticFrame {
        // Humanize: Non-linear easing for smoother vocal tract transitions (coarticulation)
        let smooth_factor = factor * factor * (3.0 - 2.0 * factor); 
        let inv = 1.0 - smooth_factor;
        
        let mut interp = AcousticFrame {
            f0: (self.current_frame.f0 * inv) + (self.target_frame.f0 * smooth_factor),
            voicing: (self.current_frame.voicing * inv) + (self.target_frame.voicing * smooth_factor),
            breathiness: (self.current_frame.breathiness * inv) + (self.target_frame.breathiness * smooth_factor),
            formant_freqs: [0.0; MAX_FORMANTS], formant_bandwidths: [0.0; MAX_FORMANTS], formant_gains: [0.0; MAX_FORMANTS],
        };

        for i in 0..MAX_FORMANTS {
            interp.formant_freqs[i] = (self.current_frame.formant_freqs[i] * inv) + (self.target_frame.formant_freqs[i] * smooth_factor);
            interp.formant_bandwidths[i] = (self.current_frame.formant_bandwidths[i] * inv) + (self.target_frame.formant_bandwidths[i] * smooth_factor);
            interp.formant_gains[i] = (self.current_frame.formant_gains[i] * inv) + (self.target_frame.formant_gains[i] * smooth_factor);
        }
        interp
    }

    pub fn synthesize_text_to_stream<F>(&mut self, text: &str, mut pcm_sink: F) where F: FnMut(&[f32]) {
        let chars: Vec<char> = text.chars().collect();
        let total_chars = chars.len();
        
        self.is_speaking.store(true, Ordering::Release);

        for (idx, &ch) in chars.iter().enumerate() {
            self.target_frame = Articulator::phoneme_to_target(ch, self.base_f0);
            
            // Humanize: Dynamic timing. Vowels hold longer, consonants snap faster, punctuation creates pauses.
            let duration_ms = match ch.to_ascii_lowercase() {
                'a'|'e'|'i'|'o'|'u' => 110.0,
                ' '|'.'|','|'?'|'!' => 200.0,
                _ => 60.0,
            };
            let duration_samples = ((SAMPLE_RATE * duration_ms) / 1000.0) as usize;
            
            // Humanize: Prosody envelope. Pitch drifts down naturally toward the end of a sentence.
            let progress = idx as f32 / total_chars.max(1) as f32;
            let intonation = if text.ends_with('?') { 1.0 + (progress * 0.2) } else { 1.0 - (progress * 0.15) };

            let mut scratchpad = vec![0.0f32; duration_samples];
            for (i, sample) in scratchpad.iter_mut().enumerate() {
                let t = i as f32 / duration_samples as f32;
                let frame = self.interpolate_frames(t);
                let exc = self.exciter.step(frame.f0, frame.voicing, frame.breathiness, intonation);
                *sample = self.tract.process_sample(exc, &frame);
            }

            pcm_sink(&scratchpad);
            self.current_frame = self.target_frame;
        }

        self.is_speaking.store(false, Ordering::Release);
    }
}

pub struct VoiceOutputChannel { engine: VoiceSynthesizer }

impl VoiceOutputChannel {
    pub fn new(fundamental_freq: f32) -> Self { Self { engine: VoiceSynthesizer::new(fundamental_freq) } }
    pub fn render_sentence(&mut self, text: &str) -> Vec<f32> {
        let mut audio_stream = Vec::new();
        self.engine.synthesize_text_to_stream(text, |block| audio_stream.extend_from_slice(block));
        audio_stream
    }
}

// --- C-FFI BINDINGS FOR THE VOICE ---

#[no_mangle]
pub extern "C" fn artemis_voice_alloc(f0: f32) -> *mut VoiceOutputChannel { Box::into_raw(Box::new(VoiceOutputChannel::new(f0))) }

#[no_mangle]
pub extern "C" fn artemis_voice_render(ptr: *mut VoiceOutputChannel, text_ptr: *const u8, text_len: usize, out_samples_len: *mut usize) -> *mut f32 {
    let channel = unsafe { &mut *ptr };
    let text = unsafe { std::str::from_utf8_unchecked(std::slice::from_raw_parts(text_ptr, text_len)) };
    let mut audio = channel.render_sentence(text);
    audio.shrink_to_fit();
    unsafe { *out_samples_len = audio.len(); }
    let audio_ptr = audio.as_mut_ptr();
    std::mem::forget(audio);
    audio_ptr
}

#[no_mangle]
pub extern "C" fn artemis_voice_free(ptr: *mut VoiceOutputChannel) { if !ptr.is_null() { unsafe { drop(Box::from_raw(ptr)); } } }

#[no_mangle]
pub extern "C" fn artemis_audio_buffer_free(ptr: *mut f32, len: usize) { if !ptr.is_null() { unsafe { drop(Vec::from_raw_parts(ptr, len, len)); } } }
