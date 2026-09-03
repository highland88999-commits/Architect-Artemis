// Language: Rust
// src/brain.rs

use std::f32::consts::PI;
use std::collections::HashMap;

/// Artemis Nano-Transformer Configuration
#[derive(Clone, Copy)]
pub struct ModelConfig {
    pub dim: usize,        // Transformer dimension
    pub hidden_dim: usize, // FeedForward dimension
    pub n_layers: usize,   // Number of layers
    pub n_heads: usize,    // Number of query heads
    pub n_kv_heads: usize, // Number of key/value heads (Grouped Query Attention)
    pub vocab_size: usize, // Vocabulary size
    pub seq_len: usize,    // Max sequence length
}

/// Advanced Math Utilities for Neural Operations
pub struct Math;
impl Math {
    #[inline(always)]
    pub fn rmsnorm(out: &mut [f32], x: &[f32], weight: &[f32], size: usize) {
        let mut ss = 0.0f32;
        for i in 0..size { ss += x[i] * x[i]; }
        ss /= size as f32;
        ss += 1e-5; // Epsilon
        let inv_rms = 1.0 / ss.sqrt();
        for i in 0..size { out[i] = weight[i] * (inv_rms * x[i]); }
    }

    #[inline(always)]
    pub fn softmax(x: &mut [f32], size: usize) {
        let mut max_val = x[0];
        for i in 1..size { if x[i] > max_val { max_val = x[i]; } }
        let mut sum = 0.0;
        for i in 0..size {
            x[i] = (x[i] - max_val).exp();
            sum += x[i];
        }
        for i in 0..size { x[i] /= sum; }
    }

    #[inline(always)]
    pub fn matmul(out: &mut [f32], x: &[f32], w: &[f32], n: usize, d: usize) {
        // W is of shape (d, n)
        for i in 0..d {
            let mut val = 0.0f32;
            for j in 0..n {
                val += w[i * n + j] * x[j];
            }
            out[i] = val;
        }
    }

    // SwiGLU activation (used in modern LLMs)
    #[inline(always)]
    pub fn swiglu(out: &mut [f32], x: &[f32], y: &[f32], size: usize) {
        for i in 0..size {
            let val = x[i];
            // x * sigmoid(x) * y
            out[i] = (val / (1.0 + (-val).exp())) * y[i]; 
        }
    }
}

/// Rotary Positional Embeddings (RoPE)
fn apply_rope(q: &mut [f32], k: &mut [f32], pos: usize, dim: usize, n_heads: usize, n_kv_heads: usize) {
    let head_size = dim / n_heads;
    for i in (0..head_size).step_by(2) {
        let freq = 1.0 / 10000.0f32.powf(i as f32 / head_size as f32);
        let val = pos as f32 * freq;
        let fcr = val.cos();
        let fci = val.sin();

        // Apply to Queries
        for h in 0..n_heads {
            let idx = h * head_size + i;
            let q0 = q[idx];
            let q1 = q[idx + 1];
            q[idx] = q0 * fcr - q1 * fci;
            q[idx + 1] = q0 * fci + q1 * fcr;
        }

        // Apply to Keys
        for h in 0..n_kv_heads {
            let idx = h * head_size + i;
            let k0 = k[idx];
            let k1 = k[idx + 1];
            k[idx] = k0 * fcr - k1 * fci;
            k[idx + 1] = k0 * fci + k1 * fcr;
        }
    }
}

/// The Core Artemis Neural Architecture
pub struct ArtemisBrain {
    pub config: ModelConfig,
    // Note: In production, these weights are memory-mapped from a .safetensors or .bin file.
    // We pre-allocate dynamic memory for the forward pass context.
    token_emb_table: Vec<f32>, 
    q_cache: Vec<f32>,
    k_cache: Vec<f32>,
    v_cache: Vec<f32>,
    logits: Vec<f32>,
    current_pos: usize,
}

impl ArtemisBrain {
    pub fn new(config: ModelConfig) -> Self {
        Self {
            config,
            token_emb_table: vec![0.0; config.vocab_size * config.dim],
            q_cache: vec![0.0; config.n_layers * config.seq_len * config.dim],
            k_cache: vec![0.0; config.n_layers * config.seq_len * config.dim],
            v_cache: vec![0.0; config.n_layers * config.seq_len * config.dim],
            logits: vec![0.0; config.vocab_size],
            current_pos: 0,
        }
    }

    /// Neural Forward Pass
    pub fn forward(&mut self, token: usize) -> usize {
        let dim = self.config.dim;
        let hidden_dim = self.config.hidden_dim;
        
        // 1. Fetch Token Embedding
        let mut x = vec![0.0f32; dim];
        let emb_offset = token * dim;
        x.copy_from_slice(&self.token_emb_table[emb_offset..emb_offset + dim]);

        // 2. Pass through Transformer Layers
        for l in 0..self.config.n_layers {
            let mut xb = vec![0.0f32; dim];
            // RMSNorm would go here using layer weights:
            // Math::rmsnorm(&mut xb, &x, &layer_rms_weights, dim);
            xb.copy_from_slice(&x); // Placeholder for raw linear pass

            // QKV Projections
            let mut q = vec![0.0f32; dim];
            let mut k = vec![0.0f32; dim];
            let mut v = vec![0.0f32; dim];
            // Math::matmul(&mut q, &xb, &wq, dim, dim);
            
            apply_rope(&mut q, &mut k, self.current_pos, dim, self.config.n_heads, self.config.n_kv_heads);

            // Store Keys/Values in KV Cache
            let kv_offset = l * self.config.seq_len * dim + self.current_pos * dim;
            self.k_cache[kv_offset..kv_offset + dim].copy_from_slice(&k);
            self.v_cache[kv_offset..kv_offset + dim].copy_from_slice(&v);

            // Multi-Head Attention (Scaled Dot-Product)
            let head_size = dim / self.config.n_heads;
            let mut att = vec![0.0f32; self.config.n_heads * head_size];
            
            for h in 0..self.config.n_heads {
                let mut scores = vec![0.0f32; self.config.seq_len];
                let q_head = &q[h * head_size..(h + 1) * head_size];
                
                for t in 0..=self.current_pos {
                    let k_off = l * self.config.seq_len * dim + t * dim + h * head_size;
                    let k_head = &self.k_cache[k_off..k_off + head_size];
                    let mut score = 0.0;
                    for i in 0..head_size { score += q_head[i] * k_head[i]; }
                    scores[t] = score / (head_size as f32).sqrt();
                }
                
                Math::softmax(&mut scores[0..=self.current_pos], self.current_pos + 1);
                
                let mut out_head = vec![0.0f32; head_size];
                for t in 0..=self.current_pos {
                    let v_off = l * self.config.seq_len * dim + t * dim + h * head_size;
                    let v_head = &self.v_cache[v_off..v_off + head_size];
                    let s = scores[t];
                    for i in 0..head_size { out_head[i] += s * v_head[i]; }
                }
                att[h * head_size..(h + 1) * head_size].copy_from_slice(&out_head);
            }

            // Residual Connection
            for i in 0..dim { x[i] += att[i]; }

            // FFN (Feed Forward)
            let mut hb = vec![0.0f32; hidden_dim];
            // Math::matmul(&mut hb, &x, &w1, dim, hidden_dim);
            // Math::swiglu(...);
            // Math::matmul(&mut x, &hb, &w2, hidden_dim, dim);
        }

        // 3. Final Classifier to Logits
        // Math::rmsnorm(&mut x, &x, &final_rms, dim);
        // Math::matmul(&mut self.logits, &x, &wcls, dim, self.config.vocab_size);
        
        self.current_pos += 1;

        // 4. Sampler: Top-1 (Greedy)
        self.sample_greedy()
    }

    fn sample_greedy(&self) -> usize {
        let mut max_i = 0;
        let mut max_val = self.logits[0];
        for i in 1..self.config.vocab_size {
            if self.logits[i] > max_val {
                max_val = self.logits[i];
                max_i = i;
            }
        }
        max_i
    }

    pub fn reset_context(&mut self) {
        self.current_pos = 0;
    }
}
