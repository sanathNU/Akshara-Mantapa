// Geometry for the room plan in the page margin. Borges, "The Library of Babel" (1941):
// each gallery is a hexagon, shelves cover four of its six sides, the two free sides lead
// on to the next gallery, and an air shaft opens in the middle. Below the hexagon, the
// current wall is drawn as its five shelves of thirty-two books.

import { BOOKS_PER_SHELF, SHELVES_PER_WALL } from './library';

export interface Point {
	x: number;
	y: number;
}

export interface Bookcase {
	wall: number;
	points: string;
	label: Point;
	current: boolean;
}

export interface ShelfRow {
	shelf: number;
	y: number;
	current: boolean;
	books: Array<{ x: number; current: boolean }>;
}

/** The drawing's viewBox. */
export const PLAN = { width: 240, height: 262 } as const;

const ROOM = { cx: 120, cy: 78, radius: 62, depth: 9, shaft: 16, door: 11, corridor: 16, labelGap: 13 };
const GRID = { top: 172, step: 6.4, row: 17 };
export const BOOK = { width: 5, height: 12 } as const;

/** Width of one shelf of books, and where it starts so the grid sits centred. */
export const GRID_SPAN = BOOKS_PER_SHELF * GRID.step - (GRID.step - BOOK.width);
export const GRID_LEFT = (PLAN.width - GRID_SPAN) / 2;

// Hexagon sides, clockwise from the top vertex:
// 0 upper-right, 1 right, 2 lower-right, 3 lower-left, 4 left, 5 upper-left.
const SHELVED_SIDES: ReadonlyArray<readonly [side: number, wall: number]> = [
	[5, 1],
	[0, 2],
	[2, 3],
	[3, 4]
];
const PASSAGE_SIDES: ReadonlyArray<readonly [side: number, outward: 1 | -1]> = [
	[1, 1],
	[4, -1]
];

/** Vertices of a pointy-top hexagon, clockwise from the top. */
export function hexPoints(cx: number, cy: number, r: number): Point[] {
	return [-90, -30, 30, 90, 150, 210].map((degrees) => {
		const angle = (degrees * Math.PI) / 180;
		return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) };
	});
}

function toPoints(points: Point[]): string {
	return points.map(({ x, y }) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' ');
}

const outer = hexPoints(ROOM.cx, ROOM.cy, ROOM.radius);
const inner = hexPoints(ROOM.cx, ROOM.cy, ROOM.radius - ROOM.depth / Math.cos(Math.PI / 6));

export const floor = toPoints(outer);
export const shaft = toPoints(hexPoints(ROOM.cx, ROOM.cy, ROOM.shaft));

/** One bookcase along each shelved side, numbered 1–4, with its label just outside. */
export function bookcases(currentWall: number): Bookcase[] {
	return SHELVED_SIDES.map(([side, wall]) => {
		const next = (side + 1) % 6;
		const [a, b] = [outer[side], outer[next]];
		const mid = { x: (a.x + b.x) / 2 - ROOM.cx, y: (a.y + b.y) / 2 - ROOM.cy };
		const reach = Math.hypot(mid.x, mid.y);
		const out = (reach + ROOM.labelGap) / reach;
		return {
			wall,
			points: toPoints([a, b, inner[next], inner[side]]),
			label: { x: ROOM.cx + mid.x * out, y: ROOM.cy + mid.y * out + 4 },
			current: wall === currentWall
		};
	});
}

/** The two free sides: wall stubs either side of a doorway, and a corridor leading out. */
export function passages(): string[] {
	return PASSAGE_SIDES.map(([side, outward]) => {
		const [a, b] = [outer[side], outer[(side + 1) % 6]];
		const x = a.x.toFixed(1);
		const top = Math.min(a.y, b.y).toFixed(1);
		const bottom = Math.max(a.y, b.y).toFixed(1);
		const [doorTop, doorBottom] = [ROOM.cy - ROOM.door, ROOM.cy + ROOM.door];
		const corridor = outward * ROOM.corridor;
		return `M${x},${top}V${doorTop}M${x},${doorBottom}V${bottom}M${x},${doorTop}h${corridor}M${x},${doorBottom}h${corridor}`;
	});
}

/** The current wall as shelves of books, top shelf first, with the current book marked. */
export function shelfRows(currentShelf: number, currentBook: number): ShelfRow[] {
	return Array.from({ length: SHELVES_PER_WALL }, (_, s) => {
		const shelf = s + 1;
		const current = shelf === currentShelf;
		return {
			shelf,
			y: GRID.top + s * GRID.row,
			current,
			books: Array.from({ length: BOOKS_PER_SHELF }, (_, k) => ({
				x: GRID_LEFT + k * GRID.step,
				current: current && k + 1 === currentBook
			}))
		};
	});
}
