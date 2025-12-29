use wasm_bindgen::prelude::*;
use crate::{LibraryOfBabel, Location, HierarchicalAddress};

#[wasm_bindgen]
pub struct WasmLibrary {
    library: LibraryOfBabel,
}

#[wasm_bindgen]
impl WasmLibrary {
    #[wasm_bindgen(constructor)]
    pub fn new() -> Self {
        #[cfg(feature = "console_error_panic_hook")]
        console_error_panic_hook::set_once();

        Self {
            library: LibraryOfBabel::new(),
        }
    }

    /// Get a page by its hierarchical address
    #[wasm_bindgen(js_name = getPage)]
    pub fn get_page(&self, address: &str) -> String {
        let location = match self.library.parse_address(address) {
            Some(loc) => loc,
            None => return Self::error_json("Invalid address format"),
        };

        let page = self.library.generate_page(&location);
        serde_json::json!({
            "raw_address": page.location.raw_hex,
            "hierarchical": self.build_hierarchical(&page.location),
            "content": page.content,
            "formatted_content": page.formatted_content,
        }).to_string()
    }

    /// Find the address for given text (appears at start of page)
    #[wasm_bindgen(js_name = findText)]
    pub fn find_text(&self, text: &str) -> String {
        match self.library.search(text) {
            Some(result) => {
                let page = self.library.generate_page(&result.location);
                let preview: String = page.content.chars().take(80).collect();
                serde_json::json!({
                    "query": result.query,
                    "found": true,
                    "location": {
                        "raw_address": result.location.raw_hex,
                        "hierarchical": self.build_hierarchical(&result.location),
                    },
                    "page_preview": preview,
                }).to_string()
            }
            None => {
                serde_json::json!({
                    "query": text,
                    "found": false,
                    "location": null,
                    "page_preview": null,
                }).to_string()
            }
        }
    }

    /// Search for text at a random position within a page
    #[wasm_bindgen(js_name = searchText)]
    pub fn search_text(&self, query: &str) -> String {
        match self.library.search_at_random_position(query) {
            Some(result) => {
                let page = self.library.generate_page(&result.location);
                let preview: String = page.content.chars().take(80).collect();
                serde_json::json!({
                    "query": result.query,
                    "found": true,
                    "location": {
                        "raw_address": result.location.raw_hex,
                        "hierarchical": self.build_hierarchical(&result.location),
                    },
                    "page_preview": preview,
                }).to_string()
            }
            None => {
                serde_json::json!({
                    "query": query,
                    "found": false,
                    "location": null,
                    "page_preview": null,
                }).to_string()
            }
        }
    }

    /// Browse random pages
    #[wasm_bindgen(js_name = browseRandom)]
    pub fn browse_random(&self, count: usize) -> String {
        let mut responses = Vec::with_capacity(count);
        for _ in 0..count {
            let page = self.library.random_page();
            responses.push(serde_json::json!({
                "raw_address": page.location.raw_hex,
                "hierarchical": self.build_hierarchical(&page.location),
                "content": page.content,
                "formatted_content": page.formatted_content,
            }));
        }
        serde_json::to_string(&responses).unwrap_or_else(|_| "[]".to_string())
    }

    /// Get the next page after the given address
    #[wasm_bindgen]
    pub fn next_page(&self, address: &str) -> String {
        let location = match self.library.parse_address(address) {
            Some(loc) => loc,
            None => return Self::error_json("Invalid address format"),
        };

        let page = self.library.next_page(&location);
        serde_json::json!({
            "success": true,
            "raw_address": page.location.raw_hex,
            "hierarchical": self.build_hierarchical(&page.location),
            "content": page.content,
            "formatted_content": page.formatted_content,
        }).to_string()
    }

    /// Get the previous page before the given address
    #[wasm_bindgen]
    pub fn previous_page(&self, address: &str) -> String {
        let location = match self.library.parse_address(address) {
            Some(loc) => loc,
            None => return Self::error_json("Invalid address format"),
        };

        match self.library.previous_page(&location) {
            Some(page) => {
                serde_json::json!({
                    "success": true,
                    "raw_address": page.location.raw_hex,
                    "hierarchical": self.build_hierarchical(&page.location),
                    "content": page.content,
                    "formatted_content": page.formatted_content,
                }).to_string()
            }
            None => {
                serde_json::json!({
                    "success": false,
                    "error": "Already at the first page of the library"
                }).to_string()
            }
        }
    }
}

// Private helper methods (not exposed to JS)
impl WasmLibrary {
    /// Parse address from hex or hierarchical format
    fn parse_address(&self, address: &str) -> Option<Location> {
        self.library.parse_address(address)
    }

    /// Build hierarchical JSON with mandira_kannada (matches server behavior)
    fn build_hierarchical(&self, location: &Location) -> serde_json::Value {
        let mandira_kannada = self.get_mandira_kannada(location);
        
        serde_json::json!({
            "mandira_hex": location.hierarchical.mandira_hex(),
            "mandira_kannada": mandira_kannada,
            "gode": location.hierarchical.gode,
            "patti": location.hierarchical.patti,
            "pustaka": location.hierarchical.pustaka,
            "puta": location.hierarchical.puta,
            "display_string": location.hierarchical.to_display_string(),
        })
    }

    /// Compute mandira as Kannada text (only for small mandira values)
    /// Matches the server logic: only compute if bits < 10000
    fn get_mandira_kannada(&self, location: &Location) -> Option<String> {
        if location.hierarchical.mandira.bits() < 10000 {
            Some(self.library.mandira_as_kannada(&location.hierarchical.mandira))
        } else {
            None
        }
    }

    /// Create a JSON error response
    fn error_json(message: &str) -> String {
        serde_json::json!({
            "success": false,
            "error": message
        }).to_string()
    }
}

impl Default for WasmLibrary {
    fn default() -> Self {
        Self::new()
    }
}