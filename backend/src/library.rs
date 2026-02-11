//! Main library API — generic over any `Alphabet`.
//!
//! `LibraryOfBabel<A>` provides search, generation, navigation, and
//! address parsing for any script that implements the `Alphabet` trait.

use num_bigint::BigUint;
use num_traits::Zero;
use std::collections::hash_map::RandomState;
use std::hash::{BuildHasher, Hash, Hasher};

#[cfg(not(feature = "wasm"))]
use std::time::{SystemTime, UNIX_EPOCH};

use crate::bijection::BijectionEngine;
use crate::constants::{CLUSTERS_PER_LINE, CLUSTERS_PER_PAGE};
use crate::engine::alphabet::Alphabet;
use crate::engine::{GraphemeAlphabet, Kannada, Telugu};
use crate::engine::BrahmicScript;
use crate::types::{HierarchicalAddress, Location, Page, SearchResult};

/// Get current timestamp in nanoseconds (WASM-compatible)
fn get_timestamp_nanos() -> u128 {
    #[cfg(feature = "wasm")]
    {
        let millis = js_sys::Date::now() as u128;
        millis * 1_000_000
    }

    #[cfg(not(feature = "wasm"))]
    {
        SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap()
            .as_nanos()
    }
}

/// ಅಕ್ಷರ ಮಂಟಪ — A Library of Babel for any Brahmic script.
///
/// Generic over the alphabet, allowing the same library logic to work
/// with Kannada, Telugu, Tamil, or any future script implementation.
///
/// # Construction
///
/// ```rust
/// use akshara_mantapa::engine::{Kannada, Telugu};
/// use akshara_mantapa::library::LibraryOfBabel;
///
/// let kannada_lib = LibraryOfBabel::from_script(Kannada);
/// let telugu_lib  = LibraryOfBabel::from_script(Telugu);
/// ```
pub struct LibraryOfBabel<A: Alphabet> {
    alphabet: A,
    bijection: BijectionEngine,
}

// ── Convenience constructors for built-in scripts ──────────────────────

impl LibraryOfBabel<GraphemeAlphabet> {
    /// Build a library from any `BrahmicScript` definition.
    pub fn from_script<S: BrahmicScript>(script: S) -> Self {
        let alphabet = GraphemeAlphabet::from_script(&script);
        let bijection = BijectionEngine::new(alphabet.size());
        LibraryOfBabel { alphabet, bijection }
    }

    /// Convenience: Kannada library (ಅಕ್ಷರ ಮಂಟಪ)
    pub fn kannada() -> Self {
        Self::from_script(Kannada)
    }

    /// Convenience: Telugu library (అక్షర మంటపం)
    pub fn telugu() -> Self {
        Self::from_script(Telugu)
    }
}

// ── Core API (works with any Alphabet) ─────────────────────────────────

impl<A: Alphabet> LibraryOfBabel<A> {
    /// Construct from an existing alphabet and bijection engine.
    /// Prefer `from_script()` for built-in scripts.
    pub fn new(alphabet: A, bijection: BijectionEngine) -> Self {
        LibraryOfBabel { alphabet, bijection }
    }

    pub fn alphabet(&self) -> &A {
        &self.alphabet
    }

    pub fn alphabet_size(&self) -> usize {
        self.alphabet.size()
    }

    pub fn page_length(&self) -> usize {
        CLUSTERS_PER_PAGE
    }

    pub fn script_name(&self) -> &str {
        self.alphabet.script_name()
    }

    pub fn script_code(&self) -> &str {
        self.alphabet.script_code()
    }

    // ── Page generation ────────────────────────────────────────────────

    /// Generate a page from a location.
    pub fn generate_page(&self, location: &Location) -> Page {
        let raw_address = location.to_raw();
        let content_num = self.bijection.address_to_content(&raw_address);
        let indices = self
            .bijection
            .biguint_to_indices(content_num, CLUSTERS_PER_PAGE);
        let content = self.alphabet.indices_to_string(&indices);
        let formatted = self.format_content(&indices);

        Page {
            location: location.clone(),
            content,
            formatted_content: formatted,
            cluster_indices: indices,
        }
    }

    /// Generate page from raw hex address.
    pub fn generate_page_from_hex(&self, hex: &str) -> Option<Page> {
        let location = Location::from_hex(hex)?;
        Some(self.generate_page(&location))
    }

    /// Generate page from hierarchical address string (e.g., "a1b2.3.2.1.5").
    pub fn generate_page_from_hierarchical(&self, s: &str) -> Option<Page> {
        let h = HierarchicalAddress::from_display_string(s)?;
        let location = Location::from_hierarchical(h);
        Some(self.generate_page(&location))
    }

    // ── Search ─────────────────────────────────────────────────────────

    /// Search for exact text; returns the location where it appears
    /// at the start of a page.
    pub fn search(&self, query: &str) -> Option<SearchResult> {
        let query_indices = self.alphabet.segment(query)?;
        if query_indices.is_empty() {
            return None;
        }

        let mut padded = query_indices.clone();
        padded.resize(CLUSTERS_PER_PAGE, 0);

        let content_num = self.bijection.indices_to_biguint(&padded);
        let raw_address = self.bijection.content_to_address(&content_num);
        let location = Location::from_raw_address(&raw_address);

        Some(SearchResult {
            query: query.to_string(),
            location,
            cluster_count: query_indices.len(),
        })
    }

    /// Search for text embedded at a random position on a page,
    /// with random content surrounding it.
    pub fn search_at_random_position(&self, query: &str) -> Option<SearchResult> {
        let query_indices = self.alphabet.segment(query)?;
        if query_indices.is_empty() || query_indices.len() >= CLUSTERS_PER_PAGE {
            return None;
        }

        let max_position = CLUSTERS_PER_PAGE - query_indices.len();

        let state = RandomState::new();
        let now = get_timestamp_nanos();

        let mut hasher = state.build_hasher();
        now.hash(&mut hasher);
        let random_val = hasher.finish();

        let position = (random_val as usize) % (max_position + 1);

        let mut content_indices = Vec::with_capacity(CLUSTERS_PER_PAGE);

        // Random prefix
        for i in 0..position {
            let mut h = state.build_hasher();
            (now + i as u128).hash(&mut h);
            let idx = (h.finish() as usize) % self.alphabet.size();
            content_indices.push(idx);
        }

        // Insert query
        content_indices.extend_from_slice(&query_indices);

        // Random suffix
        for i in (position + query_indices.len())..CLUSTERS_PER_PAGE {
            let mut h = state.build_hasher();
            (now + i as u128 + 999999).hash(&mut h);
            let idx = (h.finish() as usize) % self.alphabet.size();
            content_indices.push(idx);
        }

        let content_num = self.bijection.indices_to_biguint(&content_indices);
        let raw_address = self.bijection.content_to_address(&content_num);
        let location = Location::from_raw_address(&raw_address);

        Some(SearchResult {
            query: query.to_string(),
            location,
            cluster_count: query_indices.len(),
        })
    }

    // ── Random & navigation ────────────────────────────────────────────

    /// Generate a random page.
    pub fn random_page(&self) -> Page {
        let state = RandomState::new();
        let now = get_timestamp_nanos();

        let mut hasher = state.build_hasher();
        now.hash(&mut hasher);
        let h1 = hasher.finish();

        let mut hasher2 = state.build_hasher();
        h1.hash(&mut hasher2);
        let h2 = hasher2.finish();

        let random_seed = format!(
            "{:016x}{:016x}{:016x}{:016x}",
            h1,
            h2,
            h1 ^ h2,
            h1.wrapping_add(h2)
        );
        let raw = BigUint::parse_bytes(random_seed.as_bytes(), 16).unwrap_or_else(BigUint::zero);
        let raw = raw % self.bijection.modulus();
        let location = Location::from_raw_address(&raw);

        self.generate_page(&location)
    }

    /// Verify that a page at the given location starts with `expected_start`.
    pub fn verify(&self, location: &Location, expected_start: &str) -> bool {
        let page = self.generate_page(location);
        page.content.starts_with(expected_start)
    }

    /// Get the next page after the given location.
    pub fn next_page(&self, location: &Location) -> Page {
        self.generate_page(&location.next())
    }

    /// Get the previous page (None if at the very first page).
    pub fn previous_page(&self, location: &Location) -> Option<Page> {
        location
            .previous()
            .map(|prev| self.generate_page(&prev))
    }

    // ── Address parsing (script-aware) ─────────────────────────────────

    /// Parse an address that may contain script-native mandira names.
    ///
    /// Accepts:
    /// - Raw hex: `"a1b2c3d4..."`
    /// - Hierarchical with hex mandira: `"a1b2.3.2.1.5"`
    /// - Hierarchical with script-native mandira: `"ಅಕ್ಷರ.3.2.1.5"`
    ///
    /// Script characters are detected using the alphabet's unicode range.
    pub fn parse_address(&self, address: &str) -> Option<Location> {
        if address.contains('.') {
            let parts: Vec<&str> = address.rsplitn(5, '.').collect();

            if parts.len() == 5 {
                let mandira_str = parts[4];

                let mandira_hex = if self.alphabet.contains_script_chars(mandira_str) {
                    self.script_text_to_hex(mandira_str)?
                } else {
                    mandira_str.to_string()
                };

                let hex_address = format!(
                    "{}.{}.{}.{}.{}",
                    mandira_hex, parts[3], parts[2], parts[1], parts[0]
                );

                HierarchicalAddress::from_display_string(&hex_address)
                    .map(Location::from_hierarchical)
            } else {
                HierarchicalAddress::from_display_string(address)
                    .map(Location::from_hierarchical)
            }
        } else if self.alphabet.contains_script_chars(address) {
            let hex = self.script_text_to_hex(address)?;
            Location::from_hex(&hex)
        } else {
            Location::from_hex(address)
        }
    }

    /// Convert script-native text to a hex number via the alphabet encoding.
    pub fn script_text_to_hex(&self, text: &str) -> Option<String> {
        let indices = self.alphabet.segment(text)?;
        if indices.is_empty() {
            return None;
        }
        let num = self.bijection.indices_to_biguint(&indices);
        Some(num.to_str_radix(16))
    }

    /// Display a mandira BigUint as script-native text.
    pub fn mandira_as_text(&self, mandira: &BigUint) -> String {
        // Use page_length - 1 to avoid full-page-length mandira names
        let indices = self
            .bijection
            .biguint_to_indices(mandira.clone(), CLUSTERS_PER_PAGE - 1);
        let start = indices.iter().position(|&x| x != 0).unwrap_or(0);
        self.alphabet.indices_to_string(&indices[start..])
    }

    // ── Formatting ─────────────────────────────────────────────────────

    fn format_content(&self, indices: &[usize]) -> String {
        let mut formatted = String::new();
        for (i, &idx) in indices.iter().enumerate() {
            if i > 0 && i % CLUSTERS_PER_LINE == 0 {
                formatted.push('\n');
            }
            if let Some(cluster) = self.alphabet.get(idx) {
                formatted.push_str(cluster);
            }
        }
        formatted
    }
}

// ── Backward compatibility ─────────────────────────────────────────────

impl LibraryOfBabel<GraphemeAlphabet> {
    /// Backward-compatible alias for `mandira_as_text`.
    pub fn mandira_as_kannada(&self, mandira: &BigUint) -> String {
        self.mandira_as_text(mandira)
    }

    /// Backward-compatible alias for `script_text_to_hex`.
    pub fn kannada_to_hex(&self, kannada: &str) -> Option<String> {
        self.script_text_to_hex(kannada)
    }

    /// Backward-compatible: check if string contains this library's script.
    pub fn contains_kannada(s: &str) -> bool {
        s.chars()
            .any(|c| ('\u{0C80}'..='\u{0CFF}').contains(&c))
    }
}

impl Default for LibraryOfBabel<GraphemeAlphabet> {
    /// Default is the Kannada library for backward compatibility.
    fn default() -> Self {
        Self::kannada()
    }
}