//! தமிழ் (Tamil) script definition.
//!
//! Provides the character inventory for Tamil, including the standard Tamil
//! vowels, consonants, dependent vowel signs, virama, and common Grantha
//! letters used for Sanskrit and loanword sounds.

use super::BrahmicScript;

/// Tamil script character inventory.
///
/// Tamil has a smaller native consonant inventory than Kannada and Telugu.
/// This definition also includes the common Grantha consonants in the Tamil
/// Unicode block so mixed Tamil text remains addressable.
pub struct Tamil;

impl BrahmicScript for Tamil {
    fn script_name(&self) -> &'static str {
        "தமிழ்"
    }

    fn script_code(&self) -> &'static str {
        "Taml"
    }

    fn unicode_range(&self) -> (u32, u32) {
        (0x0B80, 0x0BFF)
    }

    fn consonants(&self) -> &'static [char] {
        &[
            // Core Tamil consonants
            'க', 'ங', 'ச', 'ஞ', 'ட', 'ண', 'த', 'ந', 'ப', 'ம', 'ய', 'ர', 'ல', 'வ', 'ழ', 'ள',
            'ற', 'ன',
            // Grantha consonants commonly used in Tamil text
            'ஜ', 'ஶ', 'ஷ', 'ஸ', 'ஹ',
        ]
    }

    fn vowels(&self) -> &'static [char] {
        &['அ', 'ஆ', 'இ', 'ஈ', 'உ', 'ஊ', 'எ', 'ஏ', 'ஐ', 'ஒ', 'ஓ', 'ஔ']
    }

    fn matras(&self) -> &'static [char] {
        &['ா', 'ி', 'ீ', 'ு', 'ூ', 'ெ', 'ே', 'ை', 'ொ', 'ோ', 'ௌ']
    }

    fn halant(&self) -> char {
        '்'
    }

    fn modifiers(&self) -> &'static [char] {
        &['ஂ', 'ஃ'] // Anusvara, Aytham
    }

    fn punctuation(&self) -> &'static [char] {
        &['.', ',', '!', '?', '।']
    }

    fn max_conjunct_length(&self) -> usize {
        2
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::engine::alphabet::{Alphabet, GraphemeAlphabet};

    #[test]
    fn tamil_alphabet_generates() {
        let alphabet = GraphemeAlphabet::from_script(&Tamil);
        assert!(
            alphabet.size() > 20_000,
            "Tamil alphabet seems too small: {}",
            alphabet.size()
        );
        println!("Tamil alphabet size: {}", alphabet.size());
    }

    #[test]
    fn tamil_space_is_index_zero() {
        let alphabet = GraphemeAlphabet::from_script(&Tamil);
        assert_eq!(alphabet.get(0), Some(" "));
        assert_eq!(alphabet.index_of(" "), Some(0));
    }

    #[test]
    fn tamil_roundtrip() {
        let alphabet = GraphemeAlphabet::from_script(&Tamil);
        let text = "தமிழ்";
        let indices = alphabet.segment(text).expect("segmentation failed");
        let reconstructed = alphabet.indices_to_string(&indices);
        assert_eq!(text, reconstructed);
    }

    #[test]
    fn tamil_script_detection() {
        let alphabet = GraphemeAlphabet::from_script(&Tamil);
        assert!(alphabet.contains_script_chars("hello தமிழ் world"));
        assert!(!alphabet.contains_script_chars("hello ಕನ್ನಡ world"));
    }
}
