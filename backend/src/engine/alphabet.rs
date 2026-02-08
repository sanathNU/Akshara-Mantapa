//! Generic alphabet generation for Brahmic scripts.
//!
//! This module provides the `Alphabet` trait (consumed by the library core)
//! and `GraphemeAlphabet`, a concrete implementation that can be built from
//! any `BrahmicScript`.

use std::collections::HashMap;

use super::BrahmicScript;

// ============================================================================
// Alphabet Trait
// ============================================================================

/// Trait consumed by `LibraryOfBabel` and `BijectionEngine`.
///
/// Any type that provides an indexed set of string clusters with bidirectional
/// lookup and greedy segmentation can serve as a library alphabet.
pub trait Alphabet: Send + Sync {
    /// Total number of clusters in this alphabet (= base of the number system)
    fn size(&self) -> usize;

    /// Look up the cluster string at a given index
    fn get(&self, index: usize) -> Option<&str>;

    /// Look up the index of a given cluster string
    fn index_of(&self, cluster: &str) -> Option<usize>;

    /// Segment a text string into a sequence of cluster indices
    /// using greedy longest-match. Returns `None` if any portion
    /// of the input cannot be matched.
    fn segment(&self, text: &str) -> Option<Vec<usize>>;

    /// Convert a slice of cluster indices back to a string
    fn indices_to_string(&self, indices: &[usize]) -> String;

    /// Human-readable name of this alphabet's script
    fn script_name(&self) -> &str;

    /// ISO 15924 script code
    fn script_code(&self) -> &str;

    /// Unicode block range for detecting this script in input
    fn unicode_range(&self) -> (u32, u32);

    /// Check if a string contains characters from this script
    fn contains_script_chars(&self, s: &str) -> bool {
        let (start, end) = self.unicode_range();
        s.chars().any(|c| {
            let cp = c as u32;
            cp >= start && cp <= end
        })
    }
}

// ============================================================================
// GraphemeAlphabet
// ============================================================================

/// A concrete alphabet built by enumerating all valid grapheme clusters
/// from a `BrahmicScript` implementation.
///
/// The generation order is deterministic and defines the canonical cluster
/// ordering. Changing the order (or the script's character lists) changes
/// the alphabet size N, which invalidates all existing addresses.
///
/// # Generation order
///
/// ```text
///  0: Space (padding, always index 0)
///  1..P: Punctuation
///  P+1..: Independent vowels (V)
///         Independent vowels + modifier (V + M)
///         Bare consonants (C)
///         Consonant + matra (C + m)
///         Consonant + matra + modifier (C + m + M)
///         Consonant + modifier (C + M)
///         Consonant + halant (C + ್)
///         Two-consonant conjuncts (C₁ + ್ + C₂)
///         Conjunct + matra (C₁ + ್ + C₂ + m)
///         Conjunct + matra + modifier (C₁ + ್ + C₂ + m + M)
///         Conjunct + modifier (C₁ + ್ + C₂ + M)
///         Dead conjuncts (C₁ + ್ + C₂ + ್)
/// ```
pub struct GraphemeAlphabet {
    clusters: Vec<String>,
    cluster_to_index: HashMap<String, usize>,
    max_cluster_chars: usize,
    script_name: &'static str,
    script_code: &'static str,
    unicode_range: (u32, u32),
}

impl GraphemeAlphabet {
    /// Build a `GraphemeAlphabet` from any `BrahmicScript` implementation.
    ///
    /// This is the only constructor. It enumerates all valid grapheme clusters
    /// in a deterministic order that becomes the canonical alphabet.
    pub fn from_script<S: BrahmicScript>(script: &S) -> Self {
        let mut clusters = Vec::new();

        let consonants = script.consonants();
        let vowels = script.vowels();
        let matras = script.matras();
        let halant = script.halant();
        let modifiers = script.modifiers();
        let punctuation = script.punctuation();

        // ── Index 0: Space (always the padding character) ──────────────
        clusters.push(" ".to_string());

        // ── Punctuation (excluding space) ──────────────────────────────
        for &p in punctuation {
            if p != ' ' {
                clusters.push(p.to_string());
            }
        }

        // ── Independent vowels ─────────────────────────────────────────
        for &v in vowels {
            clusters.push(v.to_string());
            for &m in modifiers {
                clusters.push(format!("{}{}", v, m));
            }
        }

        // ── Bare consonants (with inherent vowel) ──────────────────────
        for &c in consonants {
            clusters.push(c.to_string());
        }

        // ── Consonant + matra combinations ─────────────────────────────
        for &c in consonants {
            for &matra in matras {
                clusters.push(format!("{}{}", c, matra));
                for &m in modifiers {
                    clusters.push(format!("{}{}{}", c, matra, m));
                }
            }
            for &m in modifiers {
                clusters.push(format!("{}{}", c, m));
            }
        }

        // ── Consonant + halant (explicit half-form) ────────────────────
        for &c in consonants {
            clusters.push(format!("{}{}", c, halant));
        }

        // ── Two-consonant conjuncts ────────────────────────────────────
        if script.max_conjunct_length() >= 2 {
            for &c1 in consonants {
                for &c2 in consonants {
                    if !script.allows_conjunct(c1, c2) {
                        continue;
                    }

                    // Base conjunct: C₁ + halant + C₂
                    clusters.push(format!("{}{}{}", c1, halant, c2));

                    // Conjunct + matra (± modifier)
                    for &matra in matras {
                        clusters.push(format!("{}{}{}{}", c1, halant, c2, matra));
                        for &m in modifiers {
                            clusters.push(format!(
                                "{}{}{}{}{}",
                                c1, halant, c2, matra, m
                            ));
                        }
                    }

                    // Conjunct + modifier (no matra)
                    for &m in modifiers {
                        clusters.push(format!("{}{}{}{}", c1, halant, c2, m));
                    }
                }
            }
        }

        // ── Dead conjuncts (conjunct + trailing halant) ────────────────
        for &c1 in consonants {
            for &c2 in consonants {
                if !script.allows_conjunct(c1, c2) {
                    continue;
                }
                clusters.push(format!("{}{}{}{}", c1, halant, c2, halant));
            }
        }

        // ── Build index structures ─────────────────────────────────────
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

        GraphemeAlphabet {
            clusters,
            cluster_to_index,
            max_cluster_chars,
            script_name: script.script_name(),
            script_code: script.script_code(),
            unicode_range: script.unicode_range(),
        }
    }
}

impl Alphabet for GraphemeAlphabet {
    #[inline]
    fn size(&self) -> usize {
        self.clusters.len()
    }

    #[inline]
    fn get(&self, index: usize) -> Option<&str> {
        self.clusters.get(index).map(|s| s.as_str())
    }

    #[inline]
    fn index_of(&self, cluster: &str) -> Option<usize> {
        self.cluster_to_index.get(cluster).copied()
    }

    fn segment(&self, text: &str) -> Option<Vec<usize>> {
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

            if !matched {
                return None;
            }
        }

        Some(result)
    }

    fn indices_to_string(&self, indices: &[usize]) -> String {
        indices
            .iter()
            .filter_map(|&i| self.get(i))
            .collect()
    }

    fn script_name(&self) -> &str {
        self.script_name
    }

    fn script_code(&self) -> &str {
        self.script_code
    }

    fn unicode_range(&self) -> (u32, u32) {
        self.unicode_range
    }
}