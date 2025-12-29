//! Main library API

use num_bigint::BigUint;
use num_traits::Zero;
use std::collections::hash_map::RandomState;
use std::hash::{Hash, Hasher, BuildHasher};

#[cfg(not(feature = "wasm"))]
use std::time::{SystemTime, UNIX_EPOCH};

/// Get current timestamp in nanoseconds (WASM-compatible)
fn get_timestamp_nanos() -> u128 {
    #[cfg(feature = "wasm")]
    {
        // Use JavaScript's Date.now() which returns milliseconds
        let millis = js_sys::Date::now() as u128;
        millis * 1_000_000 // Convert to nanoseconds
    }

    #[cfg(not(feature = "wasm"))]
    {
        SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap()
            .as_nanos()
    }
}

use crate::alphabet::GraphemeAlphabet;
use crate::bijection::BijectionEngine;
use crate::constants::{CLUSTERS_PER_PAGE, CLUSTERS_PER_LINE};
use crate::types::{HierarchicalAddress, Location, Page, SearchResult};

/// Akshara Mantapa main library
pub struct LibraryOfBabel {
    alphabet: GraphemeAlphabet,
    bijection: BijectionEngine,
}

impl LibraryOfBabel {
    pub fn new() -> Self {
        let alphabet = GraphemeAlphabet::new();
        let bijection = BijectionEngine::new(alphabet.size());
        LibraryOfBabel { alphabet, bijection }
    }

    pub fn alphabet_size(&self) -> usize { self.alphabet.size() }
    
    pub fn page_length(&self) -> usize { CLUSTERS_PER_PAGE }

    /// Generate a page from a location
    pub fn generate_page(&self, location: &Location) -> Page {
        let raw_address = location.to_raw();
        let content_num = self.bijection.address_to_content(&raw_address);
        let indices = self.bijection.biguint_to_indices(content_num, CLUSTERS_PER_PAGE);
        let content = self.alphabet.indices_to_string(&indices);
        let formatted = self.format_content(&indices);

        Page {
            location: location.clone(),
            content,
            formatted_content: formatted,
            cluster_indices: indices,
        }
    }

    /// Generate page from raw hex address
    pub fn generate_page_from_hex(&self, hex: &str) -> Option<Page> {
        let location = Location::from_hex(hex)?;
        Some(self.generate_page(&location))
    }

    /// Generate page from hierarchical address string
    pub fn generate_page_from_hierarchical(&self, s: &str) -> Option<Page> {
        let h = HierarchicalAddress::from_display_string(s)?;
        let location = Location::from_hierarchical(h);
        Some(self.generate_page(&location))
    }

    /// Search for exact text, returns location where it appears at start
    pub fn search(&self, query: &str) -> Option<SearchResult> {
        let query_indices = self.alphabet.segment(query)?;
        if query_indices.is_empty() { return None; }

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

    /// Check if a string contains Kannada characters
    /// "ಡ್ಠೂಙ್ಭಂ..." to "a1b2c3..."
    pub fn contains_kannada(s: &str) -> bool {
        s.chars().any(|c| ('\u{0C80}'..='\u{0CFF}').contains(&c))
    }

     /// Parse address that may contain Kannada mandira
    /// Accepts: hex, hierarchical with hex mandira, or hierarchical with Kannada mandira
    pub fn parse_address(&self, address: &str) -> Option<Location> {
        if address.contains('.') {
            // Hierarchical format: mandira.gode.patti.pustaka.puta
            let parts: Vec<&str> = address.rsplitn(5, '.').collect();
            
            if parts.len() == 5 {
                // parts are in reverse: [puta, pustaka, patti, gode, mandira]
                let mandira_str = parts[4];
                
                // Convert Kannada mandira to hex if needed
                let mandira_hex = if Self::contains_kannada(mandira_str) {
                    self.kannada_to_hex(mandira_str)?
                } else {
                    mandira_str.to_string()
                };
                
                // Reconstruct the hierarchical string with hex mandira
                let hex_address = format!(
                    "{}.{}.{}.{}.{}",
                    mandira_hex, parts[3], parts[2], parts[1], parts[0]
                );
                
                HierarchicalAddress::from_display_string(&hex_address)
                    .map(Location::from_hierarchical)
            } else {
                // Try directly
                HierarchicalAddress::from_display_string(address)
                    .map(Location::from_hierarchical)
            }
        } else if Self::contains_kannada(address) {
            // Raw Kannada address (no dots)
            let hex = self.kannada_to_hex(address)?;
            Location::from_hex(&hex)
        } else {
            // Raw hex address
            Location::from_hex(address)
        }
    }

    /// Convert Kannada mandira string to hex
    pub fn kannada_to_hex(&self, kannada: &str) -> Option<String> {
        let indices = self.alphabet.segment(kannada)?;
        if indices.is_empty() {
            return None;
        }
        let num = self.bijection.indices_to_biguint(&indices);
        Some(num.to_str_radix(16))
    }


    /// Search for text at a random position with random surrounding content
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

    /// Generate a random page
    pub fn random_page(&self) -> Page {
        let state = RandomState::new();
        let now = get_timestamp_nanos();

        let mut hasher = state.build_hasher();
        now.hash(&mut hasher);
        let h1 = hasher.finish();

        let mut hasher2 = state.build_hasher();
        h1.hash(&mut hasher2);
        let h2 = hasher2.finish();

        let random_seed = format!("{:016x}{:016x}{:016x}{:016x}", 
            h1, h2, h1 ^ h2, h1.wrapping_add(h2));
        let raw = BigUint::parse_bytes(random_seed.as_bytes(), 16)
            .unwrap_or_else(BigUint::zero);

        let raw = raw % self.bijection.modulus();
        let location = Location::from_raw_address(&raw);

        self.generate_page(&location)
    }

    /// Verify that content matches address
    pub fn verify(&self, location: &Location, expected_start: &str) -> bool {
        let page = self.generate_page(location);
        page.content.starts_with(expected_start)
    }

    /// Get the next page after the given location
    pub fn next_page(&self, location: &Location) -> Page {
        let next_location = location.next();
        self.generate_page(&next_location)
    }

    /// Get the previous page before the given location (None if at first page)
    pub fn previous_page(&self, location: &Location) -> Option<Page> {
        location.previous().map(|prev_location| self.generate_page(&prev_location))
    }


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

    /// Display mandira as Kannada text
    pub fn mandira_as_kannada(&self, mandira: &BigUint) -> String {
        let indices = self.bijection.biguint_to_indices(mandira.clone(), 399);
        let start = indices.iter().position(|&x| x != 0).unwrap_or(0);
        self.alphabet.indices_to_string(&indices[start..])
    }
}

impl Default for LibraryOfBabel {
    fn default() -> Self { Self::new() }
}