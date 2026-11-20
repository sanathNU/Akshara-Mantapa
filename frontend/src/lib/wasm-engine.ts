import type { ScriptCode } from './api';

/** The parts of the wasm-bindgen `WasmLibrary` the frontend calls. */
export interface WasmLibraryInstance {
	browseRandom(count: number): string;
	getPage(address: string): string;
	findText(text: string): string;
	searchText(query: string): string;
	next_page(address: string): string;
	previous_page(address: string): string;
}

/** The `WasmLibrary` class: its constructor builds the Kannada engine. */
export interface WasmLibraryClass {
	new (): WasmLibraryInstance;
	newTelugu?: () => WasmLibraryInstance;
	newTamil?: () => WasmLibraryInstance;
}

/**
 * Build the engine for `script`. Throws when the WASM build predates that script,
 * rather than quietly serving Kannada pages under another script's name.
 */
export function createWasmLibrary(WasmLibrary: WasmLibraryClass, script: ScriptCode): WasmLibraryInstance {
	if (script === 'kannada') return new WasmLibrary();

	const factory = script === 'telugu' ? WasmLibrary.newTelugu : WasmLibrary.newTamil;
	if (typeof factory !== 'function') {
		throw new Error(`This WASM build has no ${script} engine; rebuild it with wasm-pack.`);
	}
	return factory.call(WasmLibrary);
}
