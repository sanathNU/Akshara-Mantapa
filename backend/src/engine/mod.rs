//! Multi-lingual engine for Brahmic script Library of Babel implementations.
//!
//! This module provides a trait-based abstraction layer that separates script-specific
//! knowledge (which consonants, vowels, matras exist) from the generic alphabet generation
//! and library operations.
//!
//! # Architecture
//!
//! ```text
//! BrahmicScript (trait)     Alphabet (trait)
//!       │                        ▲
//!       │ provides raw           │ implements
//!       │ script data            │
//!       ▼                        │
//! AlphabetGenerator ──────► GraphemeAlphabet
//!       │                        │
//!       │ enumerates all         │ used by
//!       │ valid clusters         │
//!       │                        ▼
//!       │                  LibraryOfBabel<A: Alphabet>
//!       │                        │
//!       │                        │ delegates math to
//!       │                        ▼
//!       │                  BijectionEngine (script-agnostic)
//! ```
//!
//! # Adding a new script
//!
//! 1. Create a new file (e.g., `engine/tamil.rs`)
//! 2. Define a unit struct and implement `BrahmicScript`
//! 3. Register it in this module's `pub mod` and re-exports
//! 4. Construct a library: `LibraryOfBabel::from_script(Tamil)`
//!
//! The alphabet generation, bijection math, and hierarchical addressing
//! all work automatically for any conforming script.

pub mod alphabet;
pub mod kannada;
pub mod telugu;

pub use alphabet::{Alphabet, GraphemeAlphabet};
pub use kannada::Kannada;
pub use telugu::Telugu;

/// Trait defining the character inventory of a Brahmic/Indic script.
///
/// Implementors provide the raw Unicode data for their script. The
/// `AlphabetGenerator` uses this to enumerate all valid grapheme clusters
/// in a deterministic order.
///
/// # Contract
///
/// - All returned slices must be non-empty (except `punctuation` which may vary)
/// - Characters must be valid Unicode scalar values in the script's block
/// - `halant` must be the script's virama character
/// - The ordering of characters in each slice determines the alphabet ordering
///   (and therefore all addresses). Changing order invalidates existing addresses.
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