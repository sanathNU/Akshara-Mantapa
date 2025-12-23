use wasm_bindgen::prelude::*;
use serde_wasm_bindgen::{from_value, to_value};
use crate::{LibraryOfBabel, Location, HierarchicalAddress, Page, SearchResult};


#[wasm_bindgen]
pub struct WasmLibrary {
    library: LibraryOfBabel,
}

#[wasm_bindgen]
impl WasmLibrary {
    #[wasm_bindgen(constructor)]
    pub fn new() -> Self {
        // Set panic hook for better error messages in browser console
        #[cfg(feature = "console_error_panic_hook")]
        console_error_panic_hook::set_once();

        Self {
            library: LibraryOfBabel::new(),
        }
    }

    /// Get a page by its hierarchical address
        #[wasm_bindgen(js_name = getPage)]
        pub fn get_page(&self, address: &str) -> String {
            let location = if address.contains('.') {
                match HierarchicalAddress::from_display_string(address) {
                    Some(h) => Location::from_hierarchical(h),
                    None => return serde_json::json!({"error": "Invalid hierarchical address"}).to_string(),
                }
            } else {
                match Location::from_hex(address) {
                    Some(loc) => loc,
                    None => return serde_json::json!({"error": "Invalid hex address"}).to_string(),
                }
            };

            let page = self.library.generate_page(&location);
            let response = serde_json::json!({
                "raw_address": page.location.raw_hex,
                "hierarchical": {
                    "mandira_hex": page.location.hierarchical.mandira_hex(),
                    "mandira_kannada": None as Option<String>,
                    "gode": page.location.hierarchical.gode,
                    "patti": page.location.hierarchical.patti,
                    "pustaka": page.location.hierarchical.pustaka,
                    "puta": page.location.hierarchical.puta,
                    "display_string": page.location.hierarchical.to_display_string(),
                },
                "content": page.content,
                "formatted_content": page.formatted_content,
            });
            serde_json::to_string(&response).unwrap_or_else(|_| "{}".to_string())
        }


    /// Find the address for given text
    #[wasm_bindgen(js_name = findText)]
    pub fn find_text(&self, text: &str) -> String {
        match self.library.search(text) {
            Some(result) => {
                let page = self.library.generate_page(&result.location);
                let preview: String = page.content.chars().take(80).collect();
                let response = serde_json::json!({
                    "query": result.query,
                    "found": true,
                    "location": {
                        "raw_address": result.location.raw_hex,
                        "hierarchical": {
                            "mandira_hex": result.location.hierarchical.mandira_hex(),
                            "mandira_kannada": None as Option<String>,
                            "gode": result.location.hierarchical.gode,
                            "patti": result.location.hierarchical.patti,
                            "pustaka": result.location.hierarchical.pustaka,
                            "puta": result.location.hierarchical.puta,
                            "display_string": result.location.hierarchical.to_display_string(),
                        },
                    },
                    "page_preview": preview,
                });
                serde_json::to_string(&response).unwrap_or_else(|_| "{}".to_string())
            }
            None => {
                let response = serde_json::json!({
                    "query": text,
                    "found": false,
                    "location": null,
                    "page_preview": null,
                });
                serde_json::to_string(&response).unwrap_or_else(|_| "{}".to_string())
            }
        }
    }

    /// Search for text that approximately matches the query
    #[wasm_bindgen(js_name = searchText)]
    pub fn search_text(&self, query: &str) -> String {
        match self.library.search_at_random_position(query) {
            Some(result) => {
                let page = self.library.generate_page(&result.location);
                let preview: String = page.content.chars().take(80).collect();
                let response = serde_json::json!({
                    "query": result.query,
                    "found": true,
                    "location": {
                        "raw_address": result.location.raw_hex,
                        "hierarchical": {
                            "mandira_hex": result.location.hierarchical.mandira_hex(),
                            "mandira_kannada": None as Option<String>,
                            "gode": result.location.hierarchical.gode,
                            "patti": result.location.hierarchical.patti,
                            "pustaka": result.location.hierarchical.pustaka,
                            "puta": result.location.hierarchical.puta,
                            "display_string": result.location.hierarchical.to_display_string(),
                        },
                    },
                    "page_preview": preview,
                });
                serde_json::to_string(&response).unwrap_or_else(|_| "{}".to_string())
            }
            None => {
                let response = serde_json::json!({
                    "query": query,
                    "found": false,
                    "location": null,
                    "page_preview": null,
                });
                serde_json::to_string(&response).unwrap_or_else(|_| "{}".to_string())
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
                "hierarchical": {
                    "mandira_hex": page.location.hierarchical.mandira_hex(),
                    "mandira_kannada": None as Option<String>,
                    "gode": page.location.hierarchical.gode,
                    "patti": page.location.hierarchical.patti,
                    "pustaka": page.location.hierarchical.pustaka,
                    "puta": page.location.hierarchical.puta,
                    "display_string": page.location.hierarchical.to_display_string(),
                },
                "content": page.content,
                "formatted_content": page.formatted_content,
            }));
        }
        serde_json::to_string(&responses).unwrap_or_else(|_| "[]".to_string())
    }

      /// Get the next page after the given address
    #[wasm_bindgen]
    pub fn next_page(&self, address: &str) -> String {
        let location = if address.contains('.') {
            HierarchicalAddress::from_display_string(address).map(Location::from_hierarchical)
        } else {
            Location::from_hex(address)
        };

        match location {
            Some(loc) => {
                let page = self.library.next_page(&loc);
                serde_json::json!({
                    "success": true,
                    "raw_address": page.location.raw_hex,
                    "hierarchical": {
                        "mandira_hex": page.location.hierarchical.mandira_hex(),
                        "gode": page.location.hierarchical.gode,
                        "patti": page.location.hierarchical.patti,
                        "pustaka": page.location.hierarchical.pustaka,
                        "puta": page.location.hierarchical.puta,
                        "display_string": page.location.hierarchical.to_display_string(),
                    },
                    "content": page.content,
                    "formatted_content": page.formatted_content,
                }).to_string()
            }
            None => {
                serde_json::json!({
                    "success": false,
                    "error": "Invalid address format"
                }).to_string()
            }
        }
    }

    /// Get the previous page before the given address
    #[wasm_bindgen]
    pub fn previous_page(&self, address: &str) -> String {
        let location = if address.contains('.') {
            HierarchicalAddress::from_display_string(address).map(Location::from_hierarchical)
        } else {
            Location::from_hex(address)
        };

        match location {
            Some(loc) => {
                match self.library.previous_page(&loc) {
                    Some(page) => {
                        serde_json::json!({
                            "success": true,
                            "raw_address": page.location.raw_hex,
                            "hierarchical": {
                                "mandira_hex": page.location.hierarchical.mandira_hex(),
                                "gode": page.location.hierarchical.gode,
                                "patti": page.location.hierarchical.patti,
                                "pustaka": page.location.hierarchical.pustaka,
                                "puta": page.location.hierarchical.puta,
                                "display_string": page.location.hierarchical.to_display_string(),
                            },
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
            None => {
                serde_json::json!({
                    "success": false,
                    "error": "Invalid address format"
                }).to_string()
            }
        }
    }
}

impl Default for WasmLibrary {
    fn default() -> Self {
        Self::new()
    }
}
