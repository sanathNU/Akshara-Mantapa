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
        pub fn get_page(&self, address: &str) -> Result<JsValue, JsValue> {
            let location = if address.contains('.') {
                let h = HierarchicalAddress::from_display_string(address)
                    .ok_or_else(|| JsValue::from_str("Invalid hierarchical address"))?;
                Location::from_hierarchical(h)
            } else {
                Location::from_hex(address)
                    .ok_or_else(|| JsValue::from_str("Invalid hex address"))?
            };

            let page = self.library.generate_page(&location);
            to_value(&page).map_err(|e| JsValue::from_str(&e.to_string()))
        }


    /// Find the address for given text
    #[wasm_bindgen(js_name = findText)]
    pub fn find_text(&self, text: &str) -> Result<JsValue, JsValue> {
        let result = self.library.search(text);
        to_value(&result).map_err(|e| JsValue::from_str(&format!("Serialization error: {}", e)))
    }

    /// Search for text that approximately matches the query
    #[wasm_bindgen(js_name = searchText)]
    pub fn search_text(&self, query: &str) -> Result<JsValue, JsValue> {
        let result = self.library.search_at_random_position(query);
        Ok(to_value(&result)?)
    }

    /// Browse random pages
    #[wasm_bindgen(js_name = browseRandom)]
    pub fn browse_random(&self, count: usize) -> Result<JsValue, JsValue> {
        let mut pages = Vec::with_capacity(count);
        for _ in 0..count {
            pages.push(self.library.random_page());
        }
        to_value(&pages).map_err(|e| JsValue::from_str(&e.to_string()))
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
