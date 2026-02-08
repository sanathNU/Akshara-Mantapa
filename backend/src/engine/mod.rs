
pub mod alphabet;
pub mod kannada;
pub mod telugu;

pub use alphabet::{Alphabet, GraphemeAlphabet};
pub use kannada::Kannada;
pub use telugu::Telugu;

pub trait BrahmicScript: Send + Sync {
    /// Human-readable script name (preferably in the script itself)
    fn script_name(&self) -> &'static str;

    /// ISO 15924 four-letter script code (e.g., "Knda", "Telu")
    fn script_code(&self) -> &'static str;

    /// Unicode block range (inclusive start, inclusive end)
    /// Used for detecting this script in user input
    fn unicode_range(&self) -> (u32, u32);

    /// Base consonants in traditional order
    fn consonants(&self) -> &'static [char];

    /// Independent vowel forms
    fn vowels(&self) -> &'static [char];

    /// Dependent vowel signs (matras)
    fn matras(&self) -> &'static [char];

    /// The virama / halant character
    fn halant(&self) -> char;

    /// Post-base modifiers: anusvara, visarga, chandrabindu, etc.
    fn modifiers(&self) -> &'static [char];

    /// Punctuation characters (space should NOT be included — it's always index 0)
    fn punctuation(&self) -> &'static [char];

    /// Maximum consonants in a conjunct cluster (default: 2)
    /// e.g., 2 means C₁ + halant + C₂ is the max conjunct depth
    fn max_conjunct_length(&self) -> usize {
        2
    }

    /// Optional: filter out invalid conjunct pairs.
    /// Return `false` to exclude C₁ + halant + C₂ from the alphabet.
    /// Default: all pairs allowed.
    fn allows_conjunct(&self, _c1: char, _c2: char) -> bool {
        true
    }
}
