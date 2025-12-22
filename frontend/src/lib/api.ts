const API_BASE = 'http://127.0.0.1:3000/api';

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

export async function getRandomPage(): Promise<Page> {
	const response = await fetch(`${API_BASE}/random`);
	if (!response.ok) throw new Error('Failed to fetch random page');
	return response.json();
}

export async function getPageByAddress(address: string): Promise<Page> {
	const params = new URLSearchParams({ address });
	const response = await fetch(`${API_BASE}/page?${params}`);
	if (!response.ok) throw new Error('Failed to fetch page');
	return response.json();
}

export async function getNextPage(address: string): Promise<Page> {
	const params = new URLSearchParams({ address });
	const response = await fetch(`${API_BASE}/page/next?${params}`);
	if (!response.ok) throw new Error('Failed to fetch next page');
	return response.json();
}

export async function getPreviousPage(address: string): Promise<Page | null> {
	const params = new URLSearchParams({ address });
	const response = await fetch(`${API_BASE}/page/previous?${params}`);
	
	if (response.status === 404) {
		// At first page
		return null;
	}
	
	if (!response.ok) throw new Error('Failed to fetch previous page');
	return response.json();
}

export async function searchText(query: string): Promise<SearchResponse> {
	const params = new URLSearchParams({ q: query });
	const response = await fetch(`${API_BASE}/search?${params}`);
	if (!response.ok) throw new Error('Failed to search');
	return response.json();
}

export async function searchTextRandom(query: string): Promise<SearchResponse> {
	const params = new URLSearchParams({ q: query });
	const response = await fetch(`${API_BASE}/search-random?${params}`);
	if (!response.ok) throw new Error('Failed to search at random position');
	return response.json();
}
