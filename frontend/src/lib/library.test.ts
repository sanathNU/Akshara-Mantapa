import { describe, expect, it } from 'vitest';
import { libraryExponent, libraryPosition, pagesHoldingExponent } from './library';

const KANNADA = 57_324;
const TAMIL = 20_466;

describe('libraryExponent', () => {
	it('gives the size of the library as a power of ten', () => {
		expect(Math.floor(libraryExponent(KANNADA))).toBe(1903);
		expect(Math.floor(libraryExponent(TAMIL))).toBe(1724);
	});
});

describe('libraryPosition', () => {
	it('puts the first page at the very start', () => {
		expect(libraryPosition('0', KANNADA)).toEqual({ fraction: 0, log10: -Infinity });
	});

	it('divides the page index by the number of pages exactly', () => {
		// With a two-letter alphabet there are 2^400 pages; page 2^399 is halfway in.
		const halfway = libraryPosition('8' + '0'.repeat(99), 2);
		expect(halfway?.fraction).toBe(0.5);
		expect(halfway?.log10).toBeCloseTo(Math.log10(0.5), 9);
	});

	it('still places a page too near the start for a percentage', () => {
		// Page 1 of 57324^400: about 10^-1903.3 of the way in.
		const first = libraryPosition('1', KANNADA);
		expect(first?.fraction).toBe(0);
		expect(first?.log10).toBeCloseTo(-libraryExponent(KANNADA), 6);
	});

	it('rejects an address that is not hex', () => {
		expect(libraryPosition('3eb6.4.3.30.399', KANNADA)).toBeNull();
	});
});

describe('pagesHoldingExponent', () => {
	it('counts every page a short text can appear on', () => {
		// (401 - 13) * 57324^387 ≈ 10^1844.07
		expect(Math.floor(pagesHoldingExponent(13, KANNADA) ?? 0)).toBe(1844);
	});

	it('is a single page for a text that fills the page', () => {
		expect(pagesHoldingExponent(400, KANNADA)).toBe(0);
	});

	it('has no answer for empty or overlong text', () => {
		expect(pagesHoldingExponent(0, KANNADA)).toBeNull();
		expect(pagesHoldingExponent(401, KANNADA)).toBeNull();
	});
});
