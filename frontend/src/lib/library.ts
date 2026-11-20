// Library-wide numbers for the page notes: how big the library is, where a page sits in it,
// and how many pages contain a given text. Shelving mirrors backend/src/constants.rs, which
// follows Borges, "The Library of Babel" (1941): four shelved walls, five shelves a wall,
// thirty-two books a shelf, 410 pages a book.

import { PAGE_CLUSTERS } from './text';

export const LINES_PER_PAGE = 16;
export const PAGES_PER_BOOK = 410;
export const BOOKS_PER_SHELF = 32;
export const SHELVES_PER_WALL = 5;
export const WALLS_PER_ROOM = 4;

const HEX = /^[0-9a-f]+$/i;
const POSITION_SCALE = 10n ** 12n;

/** log10 of the number of pages in the library, alphabetSize^400. */
export function libraryExponent(alphabetSize: number): number {
	return PAGE_CLUSTERS * Math.log10(alphabetSize);
}

export interface LibraryPosition {
	/** Index ÷ number of pages, to 12 decimal places (0 for pages very near the start). */
	fraction: number;
	/** log10 of the same ratio, which stays meaningful however small it gets. */
	log10: number;
}

/** log10 of a non-negative hex integer, from its length and leading digits. */
function log10OfHex(hex: string): number {
	const digits = hex.replace(/^0+/, '');
	if (!digits) return -Infinity;
	const lead = digits.slice(0, 13);
	return Math.log10(parseInt(lead, 16)) + (digits.length - lead.length) * Math.log10(16);
}

/**
 * How far into the library a page sits: its index divided by the number of pages, worked
 * out exactly on the full address. Null when the address is not plain hex.
 */
export function libraryPosition(rawAddressHex: string, alphabetSize: number): LibraryPosition | null {
	if (!HEX.test(rawAddressHex)) return null;
	const pages = BigInt(alphabetSize) ** BigInt(PAGE_CLUSTERS);
	const fraction = Number((BigInt(`0x${rawAddressHex}`) * POSITION_SCALE) / pages) / Number(POSITION_SCALE);
	return { fraction, log10: log10OfHex(rawAddressHex) - libraryExponent(alphabetSize) };
}

/**
 * log10 of how many pages contain a run of `clusterCount` clusters. The run can start at
 * any of 401 − k places and the other 400 − k clusters are free: (401 − k)·A^(400 − k).
 * Pages holding the text twice are counted twice, which is negligible at these sizes.
 */
export function pagesHoldingExponent(clusterCount: number, alphabetSize: number): number | null {
	if (!Number.isInteger(clusterCount) || clusterCount < 1 || clusterCount > PAGE_CLUSTERS) return null;
	const free = PAGE_CLUSTERS - clusterCount;
	return Math.log10(free + 1) + free * Math.log10(alphabetSize);
}
