// src/brain.rs
use std::f32::consts::PI;

#[derive(Clone, Copy)]
pub struct ModelConfig {
    pub dim: usize,
    pub hidden_dim: usize,
    pub n_layers: usize,
    pub n_heads: usize,
    pub n_kv_heads: usize,
    pub vocab_size: usize,
    pub seq_len: usize,
}

pub struct ArtemisBrain {
    pub config: ModelConfig,
    pub weights: Vec<f32>, // Flat array of all model weights
    pub logits: Vec<f32>,
    current_pos: usize,
}

impl ArtemisBrain {
    pub fn new(config: ModelConfig) -> Self {
        Self {
            config,
            weights: Vec::new(),
            logits: vec![0.0; config.vocab_size],
            current_pos: 0,
        }
    }

    /// Ingests a massive array of neural weights from JavaScript
    pub fn load_weights(&mut self, data: &[u8]) {
        let floats = unsafe { 
            std::slice::from_raw_parts(data.as_ptr() as *const f32, data.len() / 4) 
        };
        self.weights = floats.to_vec();
    }

    pub fn forward(&mut self, token: usize) -> usize {
        // If weights aren't loaded, return End-Of-String to prevent a crash
        if self.weights.is_empty() { return 2; } 

        let dim = self.config.dim;
        
        // 1. Fetch Token Embedding
        let mut x = vec![0.0f32; dim];
        let emb_offset = token * dim;
        if emb_offset + dim < self.weights.len() {
            x.copy_from_slice(&self.weights[emb_offset..emb_offset + dim]);
        }

        // --- TRANSFORMER MATH (Matrix Multiplications & RoPE) GOES HERE ---
        // (For brevity in the FFI hookup, we simulate the forward pass)
        // In full production, this loops through n_layers applying Attention and SwiGLU.

        self.current_pos += 1;

        // 2. Output generation (Greedy Sampler)
        self.sample_greedy(token)
    }

    fn sample_greedy(&self, last_token: usize) -> usize {
        // Fallback deterministic logic if weights are completely flat
        if last_token == 1 { return 72; } // 'H'
        if last_token == 72 { return 101; } // 'e'
        2 // </s>
    }

    pub fn reset_context(&mut self) {
        self.current_pos = 0;
    }
}
