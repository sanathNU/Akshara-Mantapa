//! Grapheme alphabet for Kannada script

use std::collections::HashMap;

/// Kannada script character definitions
pub struct KannadaScript;

impl KannadaScript {
    pub fn consonants() -> &'static [char] {
        &[
            'ಕ', 'ಖ', 'ಗ', 'ಘ', 'ಙ',
            'ಚ', 'ಛ', 'ಜ', 'ಝ', 'ಞ',
            'ಟ', 'ಠ', 'ಡ', 'ಢ', 'ಣ',
            'ತ', 'ಥ', 'ದ', 'ಧ', 'ನ',
            'ಪ', 'ಫ', 'ಬ', 'ಭ', 'ಮ',
            'ಯ', 'ರ', 'ಱ', 'ಲ', 'ಳ', 'ೞ', 'ವ',
            'ಶ', 'ಷ', 'ಸ', 'ಹ',
        ]
    }

    pub fn vowels() -> &'static [char] {
        &['ಅ', 'ಆ', 'ಇ', 'ಈ', 'ಉ', 'ಊ', 'ಋ', 'ೠ', 'ಎ', 'ಏ', 'ಐ', 'ಒ', 'ಓ', 'ಔ']
    }

    pub fn matras() -> &'static [char] {
        &['ಾ', 'ಿ', 'ೀ', 'ು', 'ೂ', 'ೃ', 'ೄ', 'ೆ', 'ೇ', 'ೈ', 'ೊ', 'ೋ', 'ೌ']
    }

    pub fn halant() -> char { '್' }

    pub fn modifiers() -> &'static [char] { &['ಂ', 'ಃ'] }

    pub fn punctuation() -> &'static [char] { &[' ', '.', ',', '!', '?', '।'] }
}

/// Alphabet of valid Kannada grapheme clusters
pub struct GraphemeAlphabet {
    clusters: Vec<String>,
    cluster_to_index: HashMap<String, usize>,
    max_cluster_chars: usize,
}

impl GraphemeAlphabet {
    pub fn new() -> Self {
        let mut clusters = Vec::new();

        // Index 0 = space (padding character)
        clusters.push(" ".to_string());

        // Punctuation (excluding space)
        for &p in KannadaScript::punctuation() {
            if p != ' ' {
                clusters.push(p.to_string());
            }
        }

        // Independent vowels and vowels + modifiers
        for &v in KannadaScript::vowels() {
            clusters.push(v.to_string());
            for &m in KannadaScript::modifiers() {
                clusters.push(format!("{}{}", v, m));
            }
        }

        // Bare consonants
        for &c in KannadaScript::consonants() {
            clusters.push(c.to_string());
        }

        // Consonant + matra combinations
        for &c in KannadaScript::consonants() {
            for &matra in KannadaScript::matras() {
                clusters.push(format!("{}{}", c, matra));
                for &m in KannadaScript::modifiers() {
                    clusters.push(format!("{}{}{}", c, matra, m));
                }
            }
            for &m in KannadaScript::modifiers() {
                clusters.push(format!("{}{}", c, m));
            }
        }

        // Consonant + halant
        let halant = KannadaScript::halant();
        for &c in KannadaScript::consonants() {
            clusters.push(format!("{}{}", c, halant));
        }

        // Two-consonant conjuncts
        for &c1 in KannadaScript::consonants() {
            for &c2 in KannadaScript::consonants() {
                clusters.push(format!("{}{}{}", c1, halant, c2));
                for &matra in KannadaScript::matras() {
                    clusters.push(format!("{}{}{}{}", c1, halant, c2, matra));
                    for &m in KannadaScript::modifiers() {
                        clusters.push(format!("{}{}{}{}{}", c1, halant, c2, matra, m));
                    }
                }
                for &m in KannadaScript::modifiers() {
                    clusters.push(format!("{}{}{}{}", c1, halant, c2, m));
                }
            }
        }

        // Dead conjuncts (conjunct + halant) - e.g., ರ್ನ್, ಸ್ಟ್
        for &c1 in KannadaScript::consonants() {
            for &c2 in KannadaScript::consonants() {
                clusters.push(format!("{}{}{}{}", c1, halant, c2, halant));
            }
        }
        let max_cluster_chars = clusters
            .iter()
            .map(|s| s.chars().count())
            .max()
            .unwrap_or(1);

        let cluster_to_index: HashMap<String, usize> = clusters
            .iter()
            .enumerate()
            .map(|(i, s)| (s.clone(), i))
            .collect();

        GraphemeAlphabet { clusters, cluster_to_index, max_cluster_chars }
    }

    #[inline]
    pub fn size(&self) -> usize { self.clusters.len() }

    #[inline]
    pub fn get(&self, index: usize) -> Option<&str> {
        self.clusters.get(index).map(|s| s.as_str())
    }

    #[inline]
    pub fn index_of(&self, cluster: &str) -> Option<usize> {
        self.cluster_to_index.get(cluster).copied()
    }

    /// Segment text into cluster indices using greedy longest-match
    pub fn segment(&self, text: &str) -> Option<Vec<usize>> {
        let chars: Vec<char> = text.chars().collect();
        let mut result = Vec::new();
        let mut pos = 0;

        while pos < chars.len() {
            let max_len = (chars.len() - pos).min(self.max_cluster_chars);
            let mut matched = false;

            for len in (1..=max_len).rev() {
                let candidate: String = chars[pos..pos + len].iter().collect();
                if let Some(idx) = self.cluster_to_index.get(&candidate) {
                    result.push(*idx);
                    pos += len;
                    matched = true;
                    break;
                }
            }

            if !matched { return None; }
        }
        Some(result)
    }

    /// Convert cluster indices to string
    pub fn indices_to_string(&self, indices: &[usize]) -> String {
        indices
            .iter()
            .filter_map(|&i| self.get(i))
            .collect()
    }
}

impl Default for GraphemeAlphabet {
    fn default() -> Self { Self::new() }
}