const API_BASE = 'http://127.0.0.1:3000/api';

// Detect if we're in production (GitHub Pages) or development (local)
const USE_WASM = import.meta.env.PROD;

export interface HierarchicalDisplay {
	mandira_hex: string;
	mandira_kannada?: string;  // Optional Kannada display
	gode: number;              // Wall (1-4)
	patti: number;             // Shelf (1-5)
	pustaka: number;           // Book (1-32)
	puta: number;              // Page (1-410)
	display_string: string;    // Full hierarchical address
}

export interface Page {
	raw_address: string;
	hierarchical: HierarchicalDisplay;
	content: string;
	formatted_content: string;
}

export interface LocationResponse {
	raw_address: string;
	hierarchical: HierarchicalDisplay;
}

export interface SearchResponse {
	query: string;
	found: boolean;
	location?: LocationResponse;
	page_preview?: string;
}

// WASM library singleton
let wasmLibrary: any = null;

async function getWasmLibrary() {
	if (!wasmLibrary) {
		try {
			const wasm = await import('./wasm/akshara_mantapa.js');
			wasmLibrary = new wasm.WasmLibrary();
		} catch (error) {
			console.error('Failed to load WASM module:', error);
			throw new Error('WASM module not available. Make sure to build and copy WASM files.');
		}
	}
	return wasmLibrary;
}

export async function getRandomPage(): Promise<Page> {
	if (USE_WASM) {
		const lib = await getWasmLibrary();
		const pages = lib.browseRandom(1);
		return pages[0];
	} else {
		const response = await fetch(`${API_BASE}/random`);
		if (!response.ok) throw new Error('Failed to fetch random page');
		return response.json();
	}
}

export async function getPageByAddress(address: string): Promise<Page> {
	if (USE_WASM) {
		const lib = await getWasmLibrary();
		return lib.getPage(address);
	} else {
		const params = new URLSearchParams({ address });
		const response = await fetch(`${API_BASE}/page?${params}`);
		if (!response.ok) throw new Error('Failed to fetch page');
		return response.json();
	}
}

export async function getNextPage(address: string): Promise<Page> {
	if (USE_WASM) {
		const lib = await getWasmLibrary();
		const result = JSON.parse(lib.next_page(address));
		if (!result.success) {
			throw new Error(result.error || 'Failed to get next page');
		}
		return {
			raw_address: result.raw_address,
			hierarchical: result.hierarchical,
			content: result.content,
			formatted_content: result.formatted_content
		};
	} else {
		const params = new URLSearchParams({ address });
		const response = await fetch(`${API_BASE}/page/next?${params}`);
		if (!response.ok) throw new Error('Failed to fetch next page');
		return response.json();
	}
}

export async function getPreviousPage(address: string): Promise<Page | null> {
	if (USE_WASM) {
		const lib = await getWasmLibrary();
		const result = JSON.parse(lib.previous_page(address));
		if (!result.success) {
			if (result.error?.includes('first page')) {
				return null;
			}
			throw new Error(result.error || 'Failed to get previous page');
		}
		return {
			raw_address: result.raw_address,
			hierarchical: result.hierarchical,
			content: result.content,
			formatted_content: result.formatted_content
		};
	} else {
		const params = new URLSearchParams({ address });
		const response = await fetch(`${API_BASE}/page/previous?${params}`);

		if (response.status === 404) {
			// At first page
			return null;
		}

		if (!response.ok) throw new Error('Failed to fetch previous page');
		return response.json();
	}
}

export async function searchText(query: string): Promise<SearchResponse> {
	if (USE_WASM) {
		const lib = await getWasmLibrary();
		return lib.findText(query);
	} else {
		const params = new URLSearchParams({ q: query });
		const response = await fetch(`${API_BASE}/search?${params}`);
		if (!response.ok) throw new Error('Failed to search');
		return response.json();
	}
}

export async function searchTextRandom(query: string): Promise<SearchResponse> {
	if (USE_WASM) {
		const lib = await getWasmLibrary();
		return lib.searchText(query);
	} else {
		const params = new URLSearchParams({ q: query });
		const response = await fetch(`${API_BASE}/search-random?${params}`);
		if (!response.ok) throw new Error('Failed to search at random position');
		return response.json();
	}
}
