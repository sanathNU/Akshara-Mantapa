//! # ಅಕ್ಷರ ಮಂಟಪ (Akshara Mantapa)
//!
//! A Library of Babel for Kannada.
//!
//! A bijective implementation where every page has exactly one canonical address
//! and every address maps to exactly one page.

pub mod engine;
pub mod bijection;
pub mod constants;
pub mod types;
pub mod library;

pub use constants::*;
pub use bijection::BijectionEngine;
pub use types::{HierarchicalAddress, Location, Page, SearchResult};
pub use library::LibraryOfBabel;

#[cfg(feature = "wasm")]
pub mod wasm;

#[cfg(feature = "wasm")]
pub use wasm::*;