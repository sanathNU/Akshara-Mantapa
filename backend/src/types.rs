//! Core types: addresses, locations, pages, and search results

use num_bigint::BigUint;
use num_traits::{Zero, One, ToPrimitive};
use num_integer::Integer;
use serde::{Deserialize, Serialize};

use crate::constants::*;

// ============================================================================
// Address Types
// ============================================================================

/// Hierarchical address breakdown
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HierarchicalAddress {
    pub mandira: BigUint,  // Room
    pub gode: u8,          // Wall (1-4)
    pub patti: u8,         // Shelf (1-5)
    pub pustaka: u8,       // Book (1-32)
    pub puta: u16,         // Page (1-410)
}

impl HierarchicalAddress {
    pub fn from_raw(raw: &BigUint) -> Self {
        let (rest, puta) = raw.div_rem(&BigUint::from(PAGES_PER_BOOK));
        let (rest, pustaka) = rest.div_rem(&BigUint::from(BOOKS_PER_SHELF));
        let (rest, patti) = rest.div_rem(&BigUint::from(SHELVES_PER_WALL));
        let (mandira, gode) = rest.div_rem(&BigUint::from(WALLS_PER_ROOM));

        HierarchicalAddress {
            mandira,
            gode: gode.to_u8().unwrap_or(0) + 1,
            patti: patti.to_u8().unwrap_or(0) + 1,
            pustaka: pustaka.to_u8().unwrap_or(0) + 1,
            puta: puta.to_u16().unwrap_or(0) + 1,
        }
    }

    pub fn to_raw(&self) -> BigUint {
        let mut raw = self.mandira.clone();
        raw = raw * WALLS_PER_ROOM + (self.gode - 1) as u32;
        raw = raw * SHELVES_PER_WALL + (self.patti - 1) as u32;
        raw = raw * BOOKS_PER_SHELF + (self.pustaka - 1) as u32;
        raw = raw * PAGES_PER_BOOK + (self.puta - 1) as u32;
        raw
    }

    pub fn mandira_hex(&self) -> String {
        if self.mandira.is_zero() {
            "0".to_string()
        } else {
            self.mandira.to_str_radix(16)
        }
    }

    pub fn to_display_string(&self) -> String {
        format!("{}.{}.{}.{}.{}",
            self.mandira_hex(),
            self.gode, self.patti, self.pustaka, self.puta
        )
    }

    pub fn from_display_string(s: &str) -> Option<Self> {
        let parts: Vec<&str> = s.rsplitn(5, '.').collect();
        if parts.len() != 5 { return None; }

        let puta = parts[0].parse::<u16>().ok()?;
        let pustaka = parts[1].parse::<u8>().ok()?;
        let patti = parts[2].parse::<u8>().ok()?;
        let gode = parts[3].parse::<u8>().ok()?;
        let mandira_hex = parts[4];

        let mandira = if mandira_hex == "0" {
            BigUint::zero()
        } else {
            BigUint::parse_bytes(mandira_hex.as_bytes(), 16)?
        };

        Some(HierarchicalAddress { mandira, gode, patti, pustaka, puta })
    }

    /// Get the next page in sequence
    /// Overflows: puta → pustaka → patti → gode → mandira
    pub fn next(&self) -> Self {
        let mut mandira = self.mandira.clone();
        let mut gode = self.gode;
        let mut patti = self.patti;
        let mut pustaka = self.pustaka;
        let mut puta = self.puta;

        puta += 1;
        if puta > PAGES_PER_BOOK as u16 {
            puta = 1;
            pustaka += 1;
            if pustaka > BOOKS_PER_SHELF as u8 {
                pustaka = 1;
                patti += 1;
                if patti > SHELVES_PER_WALL as u8 {
                    patti = 1;
                    gode += 1;
                    if gode > WALLS_PER_ROOM as u8 {
                        gode = 1;
                        mandira += BigUint::one();
                    }
                }
            }
        }

        HierarchicalAddress { mandira, gode, patti, pustaka, puta }
    }

    /// Get the previous page in sequence
    /// Underflows: puta → pustaka → patti → gode → mandira
    pub fn previous(&self) -> Option<Self> {
        let mut mandira = self.mandira.clone();
        let mut gode = self.gode;
        let mut patti = self.patti;
        let mut pustaka = self.pustaka;
        let mut puta = self.puta;

        if puta > 1 {
            puta -= 1;
        } else {
            puta = PAGES_PER_BOOK as u16;
            if pustaka > 1 {
                pustaka -= 1;
            } else {
                pustaka = BOOKS_PER_SHELF as u8;
                if patti > 1 {
                    patti -= 1;
                } else {
                    patti = SHELVES_PER_WALL as u8;
                    if gode > 1 {
                        gode -= 1;
                    } else {
                        gode = WALLS_PER_ROOM as u8;
                        if mandira.is_zero() {
                            // Already at the very first page
                            return None;
                        }
                        mandira -= BigUint::one();
                    }
                }
            }
        }

        Some(HierarchicalAddress { mandira, gode, patti, pustaka, puta })
    }
}

/// Complete location with raw and hierarchical forms
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Location {
    pub raw_hex: String,
    pub hierarchical: HierarchicalAddress,
}

impl Location {
    pub fn from_raw_address(raw: &BigUint) -> Self {
        let raw_hex = if raw.is_zero() {
            "0".to_string()
        } else {
            raw.to_str_radix(16)
        };
        let hierarchical = HierarchicalAddress::from_raw(raw);
        Location { raw_hex, hierarchical }
    }

    pub fn from_hex(hex: &str) -> Option<Self> {
        let raw = if hex == "0" {
            BigUint::zero()
        } else {
            BigUint::parse_bytes(hex.as_bytes(), 16)?
        };
        Some(Self::from_raw_address(&raw))
    }

    pub fn from_hierarchical(h: HierarchicalAddress) -> Self {
        let raw = h.to_raw();
        Self::from_raw_address(&raw)
    }

    pub fn to_raw(&self) -> BigUint {
        self.hierarchical.to_raw()
    }

    /// Get the next page location
    pub fn next(&self) -> Self {
        let next_h = self.hierarchical.next();
        Self::from_hierarchical(next_h)
    }

    /// Get the previous page location (None if at first page)
    pub fn previous(&self) -> Option<Self> {
        self.hierarchical.previous().map(Self::from_hierarchical)
    }
}

// ============================================================================
// Page Types
// ============================================================================

/// A page in the library
#[derive(Debug, Clone, Serialize)]
pub struct Page {
    pub location: Location,
    pub content: String,
    pub formatted_content: String,
    pub cluster_indices: Vec<usize>,
}

/// Result of a search query
#[derive(Debug, Clone, Serialize)]
pub struct SearchResult {
    pub query: String,
    pub location: Location,
    pub cluster_count: usize,
}