//! తెలుగు (Telugu) script definition.
//!
//! Provides the complete character inventory for Telugu, including
//! 36 consonants, 14 vowels, 13 matras, and 2 modifiers.
//!
//! Telugu and Kannada are sister scripts descended from Kadamba-Chalukya,
//! sharing nearly identical phonological structure. The alphabet sizes
//! are therefore very similar (~57k clusters each).

use super::BrahmicScript;

/// Telugu script character inventory.
///
/// # Note on ఱ (RRA) and ೞ (LLLA)
///
/// Like Kannada, Telugu retains archaic consonants ఱ and ళ in the
/// Unicode block. We include them for completeness (every possible
/// text must be addressable), matching the Kannada design philosophy.
pub struct Telugu;

impl BrahmicScript for Telugu {
    fn script_name(&self) -> &'static str {
        "తెలుగు"
    }

    fn script_code(&self) -> &'static str {
        "Telu"
    }

    fn unicode_range(&self) -> (u32, u32) {
        (0x0C00, 0x0C7F)
    }

    fn consonants(&self) -> &'static [char] {
        &[
            // Velars (కంఠ్య)
            'క', 'ఖ', 'గ', 'ఘ', 'ఙ',
            // Palatals (తాలవ్య)
            'చ', 'ఛ', 'జ', 'ఝ', 'ఞ',
            // Retroflexes (మూర్ధన్య)
            'ట', 'ఠ', 'డ', 'ఢ', 'ణ',
            // Dentals (దంత్య)
            'త', 'థ', 'ద', 'ధ', 'న',
            // Labials (ఓష్ఠ్య)
            'ప', 'ఫ', 'బ', 'భ', 'మ',
            // Approximants (అంతస్థ)
            'య', 'ర', 'ఱ', 'ల', 'ళ', 'ఴ', 'వ',
            // Fricatives (ఊష్మ)
            'శ', 'ష', 'స', 'హ',
        ]
    }

    fn vowels(&self) -> &'static [char] {
        &[
            'అ', 'ఆ', 'ఇ', 'ఈ', 'ఉ', 'ఊ',
            'ఋ', 'ౠ',
            'ఎ', 'ఏ', 'ఐ',
            'ఒ', 'ఓ', 'ఔ',
        ]
    }

    fn matras(&self) -> &'static [char] {
        &[
            'ా', 'ి', 'ీ', 'ు', 'ూ',
            'ృ', 'ౄ',
            'ె', 'ే', 'ై',
            'ొ', 'ో', 'ౌ',
        ]
    }

    fn halant(&self) -> char {
        '్'
    }

    fn modifiers(&self) -> &'static [char] {
        &['ం', 'ః'] // Anusvara, Visarga
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
    fn telugu_alphabet_generates() {
        let alphabet = GraphemeAlphabet::from_script(&Telugu);
        // Telugu and Kannada have the same phonological structure
        // (same number of consonants, vowels, matras, modifiers)
        // so the alphabet sizes should match.
        assert!(alphabet.size() > 50_000, "Telugu alphabet seems too small: {}", alphabet.size());
        println!("Telugu alphabet size: {}", alphabet.size());
    }

    #[test]
    fn telugu_space_is_index_zero() {
        let alphabet = GraphemeAlphabet::from_script(&Telugu);
        assert_eq!(alphabet.get(0), Some(" "));
    }

    #[test]
    fn telugu_roundtrip() {
        let alphabet = GraphemeAlphabet::from_script(&Telugu);
        let text = "తెలుగు";
        let indices = alphabet.segment(text).expect("segmentation failed");
        let reconstructed = alphabet.indices_to_string(&indices);
        assert_eq!(text, reconstructed);
    }

    #[test]
    fn telugu_script_detection() {
        let alphabet = GraphemeAlphabet::from_script(&Telugu);
        assert!(alphabet.contains_script_chars("hello తెలుగు world"));
        assert!(!alphabet.contains_script_chars("hello ಕನ್ನಡ world"));
    }
}