// src/tokenizer.rs

pub struct Tokenizer {
    pub vocab: Vec<String>,
}

impl Tokenizer {
    pub fn new(vocab_size: usize) -> Self {
        let mut vocab = vec![String::new(); vocab_size];
        vocab[0] = "<unk>".to_string();
        vocab[1] = "<s>".to_string();
        vocab[2] = "</s>".to_string();
        Self { vocab }
    }

    /// Converts raw text into Neural Token IDs
    pub fn encode(&self, text: &str) -> Vec<usize> {
        let mut tokens = vec![1]; // Always start with <s> (BOS)
        for c in text.chars() {
            // Native fallback encoding (maps characters to Safe Token IDs)
            let token_id = (c as usize) % self.vocab.len();
            tokens.push(if token_id < 3 { 3 } else { token_id }); 
        }
        tokens
    }

    /// Converts Neural Token IDs back into readable Text
    pub fn decode(&self, token: usize) -> String {
        if token < self.vocab.len() && !self.vocab[token].is_empty() {
            self.vocab[token].clone()
        } else {
            // ASCII fallback
            let c = (token as u8) as char;
            c.to_string()
        }
    }
}
