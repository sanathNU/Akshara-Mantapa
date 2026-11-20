import { describe, expect, it } from 'vitest';
import { BOOKS_PER_SHELF, SHELVES_PER_WALL, WALLS_PER_ROOM } from './library';
import { PLAN, bookcases, passages, shelfRows } from './room-plan';

describe('bookcases', () => {
	it('draws one bookcase per shelved wall and marks only the current one', () => {
		const cases = bookcases(4);
		expect(cases.map((c) => c.wall)).toEqual([1, 2, 3, 4]);
		expect(cases.length).toBe(WALLS_PER_ROOM);
		expect(cases.filter((c) => c.current).map((c) => c.wall)).toEqual([4]);
	});

	it('keeps every wall label inside the drawing', () => {
		for (const { label } of bookcases(1)) {
			expect(label.x).toBeGreaterThan(0);
			expect(label.x).toBeLessThan(PLAN.width);
			expect(label.y).toBeGreaterThan(0);
		}
	});
});

describe('passages', () => {
	it('leaves the two free sides open', () => {
		expect(passages()).toHaveLength(2);
	});
});

describe('shelfRows', () => {
	it('lays out five shelves of 32 books with exactly one current book', () => {
		const rows = shelfRows(3, 30);
		expect(rows).toHaveLength(SHELVES_PER_WALL);
		expect(rows.every((row) => row.books.length === BOOKS_PER_SHELF)).toBe(true);
		const current = rows.flatMap((row, r) => row.books.map((book, b) => (book.current ? [r + 1, b + 1] : null))).filter(Boolean);
		expect(current).toEqual([[3, 30]]);
		expect(rows.filter((row) => row.current).map((row) => row.shelf)).toEqual([3]);
	});

	it('fits the grid inside the drawing', () => {
		const rows = shelfRows(5, 32);
		const last = rows.at(-1)!;
		expect(last.books.at(-1)!.x).toBeLessThan(PLAN.width);
		expect(last.y).toBeLessThan(PLAN.height);
	});
});
