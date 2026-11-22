import { describe, expect, it } from 'vitest';
import {
	bookOf,
	callDigits,
	coverDrawing,
	coverMarks,
	coverSvg,
	palette,
	randomAddress,
	scriptDigits,
	seededRandom,
	shelfNeighbours,
	stairFacts,
	stairMarks,
	stairSvg,
	tapeDigits
} from './cover';

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

describe('randomAddress', () => {
	it('repeats for a seeded source and stays inside the library', () => {
		const a = randomAddress(57_324, seededRandom(20261164));
		expect(randomAddress(57_324, seededRandom(20261164))).toBe(a);
		expect(BigInt(`0x${a}`) < 57_324n ** 400n).toBe(true);
	});

	it('gives the Info page a first book in a full-length room', () => {
		const book = bookOf(randomAddress(57_324, seededRandom(20261164)), 'kannada')!;
		expect(book).toMatchObject({ wall: 3, shelf: 2, slot: 1, binding: 0 });
		expect(book.roomHex.length).toBeGreaterThan(1500);
	});
});

describe('shelfNeighbours', () => {
	it('walks along the same shelf from this book, wrapping after 32', () => {
		const book = bookOf(raw(ROOM, 2, 4, 30, 77), 'kannada')!;
		const next = shelfNeighbours(book, 4);
		expect(next.map((n) => n.slot)).toEqual([30, 31, 32, 1]);
		for (const n of next) expect(bookOf(n.address, 'kannada')).toMatchObject({ roomHex: ROOM, wall: 2, shelf: 4, slot: n.slot });
	});
});

describe('coverMarks', () => {
	it('puts all four markers on the cover', () => {
		for (const address of ['0', raw(ROOM, 3, 2, 17, 1), 'f'.repeat(1580)]) {
			const marks = coverMarks(bookOf(address, 'kannada')!);
			expect(marks).toHaveLength(4);
			for (const [x, y] of marks) {
				expect(x).toBeGreaterThan(0);
				expect(x).toBeLessThan(400);
				expect(y).toBeGreaterThan(0);
				expect(y).toBeLessThan(600);
			}
		}
	});

	it('puts the second marker on the first hole of the call number', () => {
		const book = bookOf(raw(ROOM, 4, 5, 32, 1), 'kannada')!;
		const [x, y] = coverMarks(book)[1];
		const r2 = (n: number) => Math.round(n * 100) / 100;
		const accent = coverSvg(book, 'kannada').match(new RegExp(`<path d="([^"]+)" fill="${palette(book.binding).accent}"/>`))![1];
		expect(accent.startsWith(`M${r2(x - 2.3)},${r2(y)}`)).toBe(true);
	});
});

describe('stairFacts and stairMarks', () => {
	it('keeps steps and turns in range, the same for every page of a book', () => {
		for (let slot = 1; slot <= 32; slot++) {
			const facts = stairFacts(bookOf(raw(ROOM, 1, 3, slot, 1), 'kannada')!);
			expect(facts.stepsPerTurn).toBeGreaterThanOrEqual(14);
			expect(facts.stepsPerTurn).toBeLessThanOrEqual(21);
			expect(facts.turns).toBeGreaterThanOrEqual(1.5);
			expect(facts.turns).toBeLessThan(7.5);
			expect(stairFacts(bookOf(raw(ROOM, 1, 3, slot, 410), 'kannada')!)).toEqual(facts);
		}
	});

	it('puts the four stair markers inside the medallion', () => {
		for (let slot = 1; slot <= 32; slot++) {
			const marks = stairMarks(bookOf(raw(ROOM, 4, 1, slot, 1), 'telugu')!);
			expect(marks).toHaveLength(4);
			for (const [x, y] of marks) expect(Math.hypot(x - 50, y - 50)).toBeLessThan(49);
		}
	});
});
