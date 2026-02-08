//! ಕನ್ನಡ (Kannada) script definition.
//!
//! Provides the complete character inventory for Kannada, including
//! 36 consonants, 14 vowels, 13 matras, and 2 modifiers.
//!
//! This produces ~57,324 grapheme clusters with 2-consonant conjuncts.

use super::BrahmicScript;

/// Kannada script character inventory.
///
/// # Alphabet size
///
/// With `max_conjunct_length = 2` and all conjunct pairs allowed:
/// - Punctuation: 5
/// - Vowels + modifiers: 14 + 28 = 42
/// - Consonants (bare + matra + modifier combos): 36 + 36×(13 + 13×2 + 2) = 36 + 36×41 = 36 + 1476 = 1512
/// - Halant forms: 36
/// - Conjuncts (all combinations): 36² × (1 + 13 + 13×2 + 2) = 1296 × 42 = 54,432
/// - Dead conjuncts: 36² = 1,296
/// - Space: 1
/// - Total: ~57,324
pub struct Kannada;

impl BrahmicScript for Kannada {
    fn script_name(&self) -> &'static str {
        "ಕನ್ನಡ"
    }

    fn script_code(&self) -> &'static str {
        "Knda"
    }

    fn unicode_range(&self) -> (u32, u32) {
        (0x0C80, 0x0CFF)
    }

    fn consonants(&self) -> &'static [char] {
        &[
            // Velars (ಕಂಠ್ಯ)
            'ಕ', 'ಖ', 'ಗ', 'ಘ', 'ಙ',
            // Palatals (ತಾಲವ್ಯ)
            'ಚ', 'ಛ', 'ಜ', 'ಝ', 'ಞ',
            // Retroflexes (ಮೂರ್ಧನ್ಯ)
            'ಟ', 'ಠ', 'ಡ', 'ಢ', 'ಣ',
            // Dentals (ದಂತ್ಯ)
            'ತ', 'ಥ', 'ದ', 'ಧ', 'ನ',
            // Labials (ಓಷ್ಠ್ಯ)
            'ಪ', 'ಫ', 'ಬ', 'ಭ', 'ಮ',
            // Approximants (ಅಂತಸ್ಥ)
            'ಯ', 'ರ', 'ಱ', 'ಲ', 'ಳ', 'ೞ', 'ವ',
            // Fricatives (ಊಷ್ಮ)
            'ಶ', 'ಷ', 'ಸ', 'ಹ',
        ]
    }

    fn vowels(&self) -> &'static [char] {
        &[
            'ಅ', 'ಆ', 'ಇ', 'ಈ', 'ಉ', 'ಊ',
            'ಋ', 'ೠ',
            'ಎ', 'ಏ', 'ಐ',
            'ಒ', 'ಓ', 'ಔ',
        ]
    }

    fn matras(&self) -> &'static [char] {
        &[
            'ಾ', 'ಿ', 'ೀ', 'ು', 'ೂ',
            'ೃ', 'ೄ',
            'ೆ', 'ೇ', 'ೈ',
            'ೊ', 'ೋ', 'ೌ',
        ]
    }

    fn halant(&self) -> char {
        '್'
    }

    fn modifiers(&self) -> &'static [char] {
        &['ಂ', 'ಃ'] // Anusvara, Visarga
    }

    fn punctuation(&self) -> &'static [char] {
        &['.', ',', '!', '?', '।'] // Space is implicit at index 0
    }

    fn max_conjunct_length(&self) -> usize {
        2
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::engine::alphabet::GraphemeAlphabet;

    #[test]
    fn kannada_alphabet_size_is_stable() {
        let alphabet = GraphemeAlphabet::from_script(&Kannada);
        // This is the canonical size. Changing it invalidates all addresses.
        // Update this assertion only if you intentionally change the alphabet.
        assert_eq!(alphabet.size(), 57_324, "Kannada alphabet size changed! This invalidates all existing addresses.");
    }

    #[test]
    fn space_is_always_index_zero() {
        let alphabet = GraphemeAlphabet::from_script(&Kannada);
        assert_eq!(alphabet.get(0), Some(" "));
        assert_eq!(alphabet.index_of(" "), Some(0));
    }

    #[test]
    fn roundtrip_segmentation() {
        let alphabet = GraphemeAlphabet::from_script(&Kannada);
        let text = "ಅಕ್ಷರ ಮಂಟಪ";
        let indices = alphabet.segment(text).expect("segmentation failed");
        let reconstructed = alphabet.indices_to_string(&indices);
        assert_eq!(text, reconstructed);
    }

    #[test]
    fn script_detection() {
        use crate::engine::alphabet::Alphabet;
        let alphabet = GraphemeAlphabet::from_script(&Kannada);
        assert!(alphabet.contains_script_chars("hello ಕನ್ನಡ world"));
        assert!(!alphabet.contains_script_chars("hello world"));
    }
}