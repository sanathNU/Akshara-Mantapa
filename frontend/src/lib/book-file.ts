// The downloadable book: all 410 pages of a book as an EPUB, its punched-tape cover as the cover image,
// titles and headings in the book's own script.

import { SCRIPT_CONFIG, type HierarchicalDisplay, type ScriptCode } from './api';
import { FONTS, bookOf, coverPng, scriptDigits } from './cover';
import { buildEpub } from './epub';
import { PAGES_PER_BOOK } from './library';

/** File name for a downloaded book. */
export const bookFileName = (h: HierarchicalDisplay) => `akshara-mantapa-book-${h.gode}-${h.patti}-${h.pustaka}.epub`;

/** dcterms:modified for now: an ISO 8601 time without fractional seconds. */
const modifiedNow = () => new Date().toISOString().replace(/\.\d{3}Z$/, 'Z');

/**
 * The book holding page `h` as EPUB bytes, from the text of its pages in order. The cover is drawn at
 * 1600 x 2400; in a browser that cannot draw it the book goes out without one.
 */
export async function bookEpub(rawAddress: string, h: HierarchicalDisplay, pages: string[], script: ScriptCode): Promise<Uint8Array<ArrayBuffer>> {
	const s = SCRIPT_CONFIG[script], n = (x: number) => scriptDigits(x, script);
	const book = bookOf(rawAddress, script);
	let cover: Uint8Array | undefined;
	try {
		if (book) cover = new Uint8Array(await (await coverPng(book, script, 4)).arrayBuffer());
	} catch (e) {
		console.error('Could not draw the cover for the book file', e);
	}
	const room = h.mandira_hex.length > 12 ? `${h.mandira_hex.slice(0, 6)}…${h.mandira_hex.slice(-4)}` : h.mandira_hex;
	return buildEpub({
		id: `urn:akshara-mantapa:${script}:${h.mandira_hex}.${h.gode}.${h.patti}.${h.pustaka}`,
		title: `${s.bookLabel} ${n(h.pustaka)} · ${s.shelfLabel} ${n(h.patti)} · ${s.wallLabel} ${n(h.gode)}`,
		creator: `${s.title} (${s.productName})`,
		language: s.lang,
		description:
			`Book ${h.pustaka} on shelf ${h.patti} of wall ${h.gode} in room ${room} of ${s.productName}, ${s.description.toLowerCase()}. ` +
			`All ${PAGES_PER_BOOK} pages are computed from their addresses.`,
		pageLabel: s.pageLabel,
		digits: n,
		contentsTitle: s.title,
		font: FONTS[script],
		modified: modifiedNow(),
		pages,
		cover
	});
}
