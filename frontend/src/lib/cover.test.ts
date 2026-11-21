import { describe, expect, it } from 'vitest';
import { bookOf, callDigits, coverDrawing, coverSvg, palette, scriptDigits, stairSvg, tapeDigits } from './cover';

const ROOM = '9f3a51c27be04d1186a2c0e7b55d0193';

/** Raw page address (hex) of a page, built the way backend/src/types.rs builds it. */
function raw(room: string, wall: number, shelf: number, book: number, page: number): string {
	const n = (((BigInt(`0x${room}`) * 4n + BigInt(wall - 1)) * 5n + BigInt(shelf - 1)) * 32n + BigInt(book - 1)) * 410n + BigInt(page - 1);
	return n.toString(16);
}

describe('bookOf', () => {
	it('reads the room, wall, shelf and book from a raw page address', () => {
		expect(bookOf(raw(ROOM, 3, 2, 17, 205), 'kannada')).toMatchObject({ roomHex: ROOM, wall: 3, shelf: 2, slot: 17 });
	});

	it('ignores the page, so every page of a book has one cover', () => {
		const first = bookOf(raw(ROOM, 4, 5, 32, 1), 'kannada')!;
		const last = bookOf(raw(ROOM, 4, 5, 32, 410), 'kannada')!;
		expect(last).toEqual(first);
		expect(coverSvg(last, 'kannada')).toBe(coverSvg(first, 'kannada'));
		expect(stairSvg(last)).toBe(stairSvg(first));
	});

	it('takes the binding from the low four bits of the book number', () => {
		expect(bookOf(raw(ROOM, 1, 1, 1, 9), 'kannada')!.binding).toBe(0);
		expect(bookOf(raw(ROOM, 1, 1, 12, 9), 'kannada')!.binding).toBe(11);
		expect(bookOf(raw(ROOM, 1, 1, 17, 9), 'kannada')!.binding).toBe(0);
	});

	it('seeds the same book number in another script differently', () => {
		const address = raw(ROOM, 2, 2, 2, 2);
		expect(bookOf(address, 'tamil')!.seed).not.toBe(bookOf(address, 'kannada')!.seed);
	});

	it('handles the library’s first page', () => {
		expect(bookOf('0', 'kannada')).toMatchObject({ roomHex: '0', wall: 1, shelf: 1, slot: 1, binding: 0 });
	});

	it('rejects anything that is not plain hex', () => {
		expect(bookOf('', 'kannada')).toBeNull();
		expect(bookOf('12g4', 'kannada')).toBeNull();
	});
});

describe('tapeDigits', () => {
	it('punches the room number first, most significant digit first', () => {
		const book = bookOf(raw(ROOM, 1, 1, 1, 1), 'kannada')!;
		expect(tapeDigits(book, 8).slice(0, 5)).toEqual([0x9, 0xf, 0x3, 0xa, 0x5]);
	});

	it('ends with wall, shelf and book packed into three digits', () => {
		const book = bookOf(raw(ROOM, 4, 5, 32, 1), 'kannada')!;
		expect(tapeDigits(book, 20).slice(-3)).toEqual(callDigits(book));
		const [hi, mid, lo] = callDigits(book);
		const call = (hi << 8) | (mid << 4) | lo;
		expect({ wall: (call >> 8) + 1, shelf: ((call >> 5) & 7) + 1, slot: (call & 31) + 1 }).toEqual({ wall: 4, shelf: 5, slot: 32 });
	});

	it('leaves rows blank past the end of a short room number', () => {
		const book = bookOf('0', 'kannada')!;
		expect(tapeDigits(book, 6)).toEqual([0, 0, 0, ...callDigits(book)]);
	});
});

describe('coverDrawing', () => {
	it('writes the label in the script’s own words and digits', () => {
		const book = bookOf(raw(ROOM, 3, 2, 17, 1), 'telugu')!;
		const label = coverDrawing(book, 'telugu').text.map((t) => t.text).join(' | ');
		expect(label).toContain('గోడ ౩');
		expect(label).toContain('పుస్తకం ౧౭');
	});

	it('leaves the label out when untitled', () => {
		const book = bookOf(raw(ROOM, 3, 2, 17, 1), 'kannada')!;
		expect(coverDrawing(book, 'kannada', { titled: false }).text).toEqual([]);
	});
});

describe('coverSvg', () => {
	it('draws a different tape for a different book', () => {
		const a = bookOf(raw(ROOM, 1, 1, 1, 1), 'kannada')!;
		const b = bookOf(raw(ROOM, 1, 1, 2, 1), 'kannada')!;
		expect(coverSvg(a, 'kannada')).not.toBe(coverSvg(b, 'kannada'));
	});

	it('can leave text out, for an export that draws it with the page’s fonts', () => {
		const book = bookOf(raw(ROOM, 1, 1, 1, 1), 'kannada')!;
		expect(coverSvg(book, 'kannada')).toContain('<text');
		expect(coverSvg(book, 'kannada', { text: false })).not.toContain('<text');
	});

	it('only ever writes finite numbers', () => {
		for (const address of ['0', raw(ROOM, 2, 3, 4, 5), 'f'.repeat(1580)]) {
			const book = bookOf(address, 'tamil')!;
			expect(coverSvg(book, 'tamil')).not.toMatch(/NaN|Infinity|undefined/);
			expect(stairSvg(book)).not.toMatch(/NaN|Infinity|undefined/);
		}
	});
});

describe('stairSvg', () => {
	it('marks one step in the binding’s accent and differs from book to book', () => {
		const a = bookOf(raw(ROOM, 1, 1, 5, 1), 'kannada')!;
		const b = bookOf(raw(ROOM, 1, 1, 6, 1), 'kannada')!;
		expect(stairSvg(a)).toContain(palette(a.binding).accent);
		expect(stairSvg(a)).not.toBe(stairSvg(b));
	});
});

describe('scriptDigits', () => {
	it('writes numbers in each script’s digits', () => {
		expect(scriptDigits(410, 'kannada')).toBe('೪೧೦');
		expect(scriptDigits(410, 'telugu')).toBe('౪౧౦');
		expect(scriptDigits(410, 'tamil')).toBe('௪௧௦');
	});
});
