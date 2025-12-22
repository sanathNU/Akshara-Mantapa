use wasm_bindgen::prelude::*;
use serde_wasm_bindgen::{from_value, to_value};
use crate::{LibraryOfBabel, HierarchicalAddress, Page, SearchResult};

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
    pub fn get_page(&self, address: JsValue) -> Result<JsValue, JsValue> {
        let address: HierarchicalAddress = from_value(address)
            .map_err(|e| JsValue::from_str(&format!("Invalid address: {}", e)))?;

        let page = self.library.get_page(&address);
        to_value(&page).map_err(|e| JsValue::from_str(&format!("Serialization error: {}", e)))
    }

    /// Find the address for given text
    #[wasm_bindgen(js_name = findText)]
    pub fn find_text(&self, text: &str) -> Result<JsValue, JsValue> {
        let result = self.library.find_text(text);
        to_value(&result).map_err(|e| JsValue::from_str(&format!("Serialization error: {}", e)))
    }

    /// Search for text that approximately matches the query
    #[wasm_bindgen(js_name = searchText)]
    pub fn search_text(&self, query: &str, limit: usize) -> Result<JsValue, JsValue> {
        let results = self.library.search_text(query, limit);
        to_value(&results).map_err(|e| JsValue::from_str(&format!("Serialization error: {}", e)))
    }

    /// Browse random pages
    #[wasm_bindgen(js_name = browseRandom)]
    pub fn browse_random(&self, count: usize) -> Result<JsValue, JsValue> {
        let pages = self.library.browse_random(count);
        to_value(&pages).map_err(|e| JsValue::from_str(&format!("Serialization error: {}", e)))
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
                let page = self.inner.next_page(&loc);
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
                match self.inner.previous_page(&loc) {
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
