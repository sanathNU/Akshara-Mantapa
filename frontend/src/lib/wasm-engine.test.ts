import { describe, expect, it } from 'vitest';
import { createWasmLibrary, type WasmLibraryClass, type WasmLibraryInstance } from './wasm-engine';

function fakeInstance(label: string): WasmLibraryInstance {
	const reply = () => label;
	return { browseRandom: reply, getPage: reply, findText: reply, searchText: reply, next_page: reply, previous_page: reply };
}

function fakeClass(factories: Partial<Pick<WasmLibraryClass, 'newTelugu' | 'newTamil'>>): WasmLibraryClass {
	class FakeLibrary {
		constructor() {
			return fakeInstance('kannada');
		}
	}
	return Object.assign(FakeLibrary, factories) as unknown as WasmLibraryClass;
}

describe('createWasmLibrary', () => {
	it('uses the default constructor for Kannada', () => {
		expect(createWasmLibrary(fakeClass({}), 'kannada').getPage('0')).toBe('kannada');
	});

	it('uses the script factory when the build has it', () => {
		const library = createWasmLibrary(fakeClass({ newTamil: () => fakeInstance('tamil') }), 'tamil');
		expect(library.getPage('0')).toBe('tamil');
	});

	it('refuses to fall back to Kannada when a script engine is missing', () => {
		expect(() => createWasmLibrary(fakeClass({}), 'telugu')).toThrow(/telugu/i);
	});
});
