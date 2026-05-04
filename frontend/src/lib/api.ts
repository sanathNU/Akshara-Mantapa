const API_BASE = import.meta.env.VITE_API_BASE || 'http://127.0.0.1:3000/api';

// Detect if we're in production (GitHub Pages) or development (local)
const USE_WASM = import.meta.env.PROD;
export type ScriptCode = 'kannada' | 'telugu' | 'tamil';
export const DEFAULT_SCRIPT_CODE: ScriptCode = 'kannada';

export const SCRIPT_CONFIG = {
	kannada: {
		code: 'kannada',
		nativeName: 'ಕನ್ನಡ',
		title: 'ಅಕ್ಷರ ಮಂಟಪ',
		productName: 'Akshara Mantapa',
		description: 'A Library of Babel for Kannada',
		intro:
			'An infinite library containing every possible combination of Kannada text. Each page is deterministically generated from a unique address. Search for any Kannada text and discover its exact location in the library. Inspired by Jorge Luis Borges.',
		searchHeading: 'Search Kannada Text',
		searchPlaceholder: 'Search for Kannada text...',
		mandiraLabel: 'ಮಂದಿರ',
		wallLabel: 'ಗೋಡೆ',
		shelfLabel: 'ಪಟ್ಟಿ',
		bookLabel: 'ಪುಸ್ತಕ',
		pageLabel: 'ಪುಟ',
		historyKey: 'akshara-mantapa-history'
	},
	telugu: {
		code: 'telugu',
		nativeName: 'తెలుగు',
		title: 'అక్షర మంటపం',
		productName: 'Akshara Mantapa',
		description: 'A Library of Babel for Telugu',
		intro:
			'An infinite library containing every possible combination of Telugu text. Each page is deterministically generated from a unique address. Search for any Telugu text and discover its exact location in the library. Inspired by Jorge Luis Borges.',
		searchHeading: 'Search Telugu Text',
		searchPlaceholder: 'Search for Telugu text...',
		mandiraLabel: 'మందిరం',
		wallLabel: 'గోడ',
		shelfLabel: 'పట్టి',
		bookLabel: 'పుస్తకం',
		pageLabel: 'పుట',
		historyKey: 'akshara-mantapa-telugu-history'
	},
	tamil: {
		code: 'tamil',
		nativeName: 'தமிழ்',
		title: 'அட்சர மண்டபம்',
		productName: 'Akshara Mantapa',
		description: 'A Library of Babel for Tamil',
		intro:
			'An infinite library containing every possible combination of Tamil text. Each page is deterministically generated from a unique address. Search for any Tamil text and discover its exact location in the library. Inspired by Jorge Luis Borges.',
		searchHeading: 'Search Tamil Text',
		searchPlaceholder: 'Search for Tamil text...',
		mandiraLabel: 'மண்டபம்',
		wallLabel: 'சுவர்',
		shelfLabel: 'அலமாரி',
		bookLabel: 'புத்தகம்',
		pageLabel: 'பக்கம்',
		historyKey: 'akshara-mantapa-tamil-history'
	}
} as const;

export const CURRENT_SCRIPT = SCRIPT_CONFIG[DEFAULT_SCRIPT_CODE];

// Debug: Log which mode we're using
console.log('API Mode:', USE_WASM ? 'WASM' : 'HTTP API');

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

// WASM library singletons, one per selected script
const wasmLibraries: Partial<Record<ScriptCode, any>> = {};

async function getWasmLibrary(script: ScriptCode = DEFAULT_SCRIPT_CODE) {
	if (!wasmLibraries[script]) {
		try {
			console.log('Loading WASM module from ./wasm/akshara_mantapa.js');
			const wasm = await import('./wasm/akshara_mantapa.js');
			console.log('WASM module loaded successfully:', wasm);

			// Initialize WASM (loads the .wasm binary)
			console.log('Initializing WASM binary...');
			await wasm.default();
			console.log('WASM binary initialized');

			// Create library instance
			const WasmLibrary = wasm.WasmLibrary as any;
			if (script === 'telugu' && WasmLibrary.newTelugu) {
				wasmLibraries[script] = WasmLibrary.newTelugu();
			} else if (script === 'tamil' && WasmLibrary.newTamil) {
				wasmLibraries[script] = WasmLibrary.newTamil();
			} else {
				wasmLibraries[script] = new WasmLibrary();
			}
			console.log('WasmLibrary instance created:', script, wasmLibraries[script]);
		} catch (error) {
			console.error('Failed to load WASM module:', error);
			throw new Error('WASM module not available. Make sure to build and copy WASM files.');
		}
	}
	return wasmLibraries[script];
}

function withScript(script: ScriptCode, params?: Record<string, string>): URLSearchParams {
	return new URLSearchParams({ ...(params ?? {}), script });
}

export async function getRandomPage(script: ScriptCode = DEFAULT_SCRIPT_CODE): Promise<Page> {
	if (USE_WASM) {
		const lib = await getWasmLibrary(script);
		const jsonString = lib.browseRandom(1);
		console.log('browseRandom returned JSON:', jsonString);
		const pages = JSON.parse(jsonString);
		return pages[0];
	} else {
		const params = withScript(script);
		const response = await fetch(`${API_BASE}/random?${params}`);
		if (!response.ok) throw new Error('Failed to fetch random page');
		return response.json();
	}
}

export async function getPageByAddress(
	address: string,
	script: ScriptCode = DEFAULT_SCRIPT_CODE
): Promise<Page> {
	if (USE_WASM) {
		const lib = await getWasmLibrary(script);
		const jsonString = lib.getPage(address);
		return JSON.parse(jsonString);
	} else {
		const params = withScript(script, { address });
		const response = await fetch(`${API_BASE}/page?${params}`);
		if (!response.ok) throw new Error('Failed to fetch page');
		return response.json();
	}
}

export async function getNextPage(
	address: string,
	script: ScriptCode = DEFAULT_SCRIPT_CODE
): Promise<Page> {
	if (USE_WASM) {
		const lib = await getWasmLibrary(script);
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
		const params = withScript(script, { address });
		const response = await fetch(`${API_BASE}/page-next?${params}`);
		if (!response.ok) throw new Error('Failed to fetch next page');
		return response.json();
	}
}

export async function getPreviousPage(
	address: string,
	script: ScriptCode = DEFAULT_SCRIPT_CODE
): Promise<Page | null> {
	if (USE_WASM) {
		const lib = await getWasmLibrary(script);
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
		const params = withScript(script, { address });
		const response = await fetch(`${API_BASE}/page-previous?${params}`);

		if (response.status === 404) {
			// At first page
			return null;
		}

		if (!response.ok) throw new Error('Failed to fetch previous page');
		return response.json();
	}
}

export async function searchText(
	query: string,
	script: ScriptCode = DEFAULT_SCRIPT_CODE
): Promise<SearchResponse> {
	if (USE_WASM) {
		const lib = await getWasmLibrary(script);
		const jsonString = lib.findText(query);
		return JSON.parse(jsonString);
	} else {
		const params = withScript(script, { q: query });
		const response = await fetch(`${API_BASE}/search?${params}`);
		if (!response.ok) throw new Error('Failed to search');
		return response.json();
	}
}

export async function searchTextRandom(
	query: string,
	script: ScriptCode = DEFAULT_SCRIPT_CODE
): Promise<SearchResponse> {
	if (USE_WASM) {
		const lib = await getWasmLibrary(script);
		const jsonString = lib.searchText(query);
		return JSON.parse(jsonString);
	} else {
		const params = withScript(script, { q: query });
		const response = await fetch(`${API_BASE}/search-random?${params}`);
		if (!response.ok) throw new Error('Failed to search at random position');
		return response.json();
	}
}
