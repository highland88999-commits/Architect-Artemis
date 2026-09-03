// src/lib.rs
mod brain;
mod tokenizer;

use brain::{ArtemisBrain, ModelConfig};
use tokenizer::Tokenizer;

pub struct AiMatrix {
    engine: ArtemisBrain,
    tokenizer: Tokenizer,
}

impl AiMatrix {
    pub fn new() -> Self {
        let config = ModelConfig {
            dim: 288, hidden_dim: 768, n_layers: 6, n_heads: 6,
            n_kv_heads: 6, vocab_size: 32000, seq_len: 512,
        };
        Self {
            engine: ArtemisBrain::new(config),
            tokenizer: Tokenizer::new(config.vocab_size),
        }
    }

    pub fn generate(&mut self, prompt: &str, max_new_tokens: usize) -> String {
        self.engine.reset_context();
        let prompt_tokens = self.tokenizer.encode(prompt);
        let mut output_str = String::new();
        
        let mut next_token = prompt_tokens[0];
        for &token in prompt_tokens.iter().skip(1) {
            self.engine.forward(next_token);
            next_token = token;
        }

        for _ in 0..max_new_tokens {
            let predicted = self.engine.forward(next_token);
            if predicted == 2 || self.engine.current_pos >= self.engine.config.seq_len { break; }
            output_str.push_str(&self.tokenizer.decode(predicted));
            next_token = predicted;
        }
        output_str
    }
}

#[no_mangle]
pub extern "C" fn artemis_brain_alloc() -> *mut AiMatrix {
    Box::into_raw(Box::new(AiMatrix::new()))
}

#[no_mangle]
pub extern "C" fn artemis_brain_load_weights(ptr: *mut AiMatrix, data_ptr: *const u8, data_len: usize) {
    let matrix = unsafe { &mut *ptr };
    let data = unsafe { std::slice::from_raw_parts(data_ptr, data_len) };
    matrix.engine.load_weights(data);
}

#[no_mangle]
pub extern "C" fn artemis_brain_infer(
    ptr: *mut AiMatrix,
    text_ptr: *const u8,
    text_len: usize,
    max_gen: usize,
    out_len: *mut usize,
) -> *mut u8 {
    let matrix = unsafe { &mut *ptr };
    let text = unsafe { std::str::from_utf8_unchecked(std::slice::from_raw_parts(text_ptr, text_len)) };
    
    let mut generated = matrix.generate(text, max_gen).into_bytes();
    generated.shrink_to_fit();
    
    unsafe { *out_len = generated.len(); }
    let gen_ptr = generated.as_mut_ptr();
    std::mem::forget(generated);
    gen_ptr
}

// ... Keep your existing VoiceOutputChannel and voice bindings below here ...
