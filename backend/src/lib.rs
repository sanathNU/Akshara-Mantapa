//! # ಅಕ್ಷರ ಮಂಟಪ (Akshara Mantapa)
//!
//! A Library of Babel for Kannada.
//!
//! A bijective implementation where every page has exactly one canonical address
//! and every address maps to exactly one page.

mod constants;
mod alphabet;
mod bijection;
mod types;
mod library;

pub use constants::*;
pub use alphabet::{GraphemeAlphabet, KannadaScript};
pub use bijection::BijectionEngine;
pub use types::{HierarchicalAddress, Location, Page, SearchResult};
pub use library::LibraryOfBabel;

#[cfg(feature = "wasm")]
pub mod wasm;

#[cfg(feature = "wasm")]
pub use wasm::*;