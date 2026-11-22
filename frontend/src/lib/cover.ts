// Book covers and history marks, drawn as SVG strings from a book's address. The cover is a strip of
// punched paper tape carrying the room number, laid out like the Curiositas covers: flat ground, a hairline
// panel, three ruled label rows, page edges behind. The history mark is Borges' "spiral stairway, which
// sinks abysmally" ("The Library of Babel", 1941), seen from above.
//
// What the address decides (book number = raw page address div 410, so every page of a book agrees):
//   book number mod 16                  one of sixteen bindings: ground, ink, accent
//   FNV-1a of script and book number    seed for the drawing's details
//   room number                         the holes punched in the tape, most significant digit first
//   wall, shelf, book                   punched last in the accent; the stair's one accent step

import { SCRIPT_CONFIG, type ScriptCode } from './api';
import { BOOKS_PER_SHELF, PAGES_PER_BOOK, SHELVES_PER_WALL, WALLS_PER_ROOM } from './library';
import { PAGE_CLUSTERS } from './text';

/** A book of the library, as far as its cover is concerned. */
export interface Book {
	/** The raw page address divided by the pages in a book. */
	number: bigint;
	roomHex: string;
	wall: number;
	shelf: number;
	/** Place on the shelf, 1-32. */
	slot: number;
	/** One of the sixteen bindings, from the low four bits of the book number. */
	binding: number;
	seed: number;
}

/** A piece of cover text, positioned in the cover's 400 x 600 frame. */
export interface CoverText {
	text: string;
	x: number;
	y: number;
	size: number;
	font: string;
	fill: string;
	opacity: number;
}

export interface Palette {
	name: string;
	ground: string;
	ink: string;
	accent: string;
	wood: string;
	void: string;
	rail: string;
	paper: string;
	tread: string;
}

export type Point = [number, number];

export const COVER_WIDTH = 400;
export const COVER_HEIGHT = 600;
const W = COVER_WIDTH;
const H = COVER_HEIGHT;
const TAU = Math.PI * 2;
/** The framed panel: picture area FR.y .. FR.y + FR.h, three ruled rows under it. */
const FR = { x: 44, y: 150, w: 312, h: 270, rows: 3, rowH: 20 };
const HEX = /^[0-9a-f]+$/i;

const f = (n: number) => Math.round(n * 100) / 100;
const P = (p: Point) => `${f(p[0])},${f(p[1])}`;
const pts = (list: Point[]) => list.map(P).join(' ');
const polar = (r: number, a: number, c: Point): Point => [c[0] + r * Math.cos(a), c[1] + r * Math.sin(a)];
/** A filled circle as path data, so many can share one path. */
const disc = (x: number, y: number, r: number) => `M${f(x - r)},${f(y)}a${r},${r} 0 1 0 ${f(2 * r)},0a${r},${r} 0 1 0 ${f(-2 * r)},0`;
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');

/** mulberry32: a small seeded generator of floats in [0, 1). */
function rng(seed: number): () => number {
	let a = seed >>> 0;
	return () => {
		a = (a + 0x6d2b79f5) | 0;
		let t = Math.imul(a ^ (a >>> 15), 1 | a);
		t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
}

/** mulberry32 under a public name, as a repeatable source for `randomAddress`. */
export const seededRandom = rng;

/** FNV-1a, 32 bits. */
function fnv1a(s: string): number {
	let h = 0x811c9dc5;
	for (let i = 0; i < s.length; i++) {
		h ^= s.charCodeAt(i);
		h = Math.imul(h, 0x01000193);
	}
	return h >>> 0;
}

/* ---------- colour ---------- */

const rgb = (hex: string) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
const toHex = (c: number[]) => `#${c.map((v) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, '0')).join('')}`;
const mix = (a: string, b: string, t: number) => {
	const y = rgb(b);
	return toHex(rgb(a).map((v, i) => v + (y[i] - v) * t));
};

const SOOT = '#170e09';
const CREAM = '#fbf3e4';

/** Sixteen bindings: name, ground, ink (frame, label, line work) and accent (this book's own marks). */
const BINDINGS: ReadonlyArray<readonly [string, string, string, string]> = [
	['ochre', '#e2a73e', '#2a1c10', '#a8202b'],
	['madder', '#9f2a2b', '#f6e9d2', '#efb544'],
	['indigo', '#22305e', '#ece4d0', '#e2873e'],
	['verdigris', '#78ab9d', '#14302a', '#a8202b'],
	['ivory', '#efe6d3', '#231b15', '#a4522a'],
	['turmeric', '#e9c64c', '#2d2410', '#2f5597'],
	['rose', '#e2a69c', '#46161a', '#22305e'],
	['sandalwood', '#d8b48e', '#3a2414', '#2f6f62'],
	['slate', '#4b5662', '#eeece4', '#e9b04a'],
	['olive', '#8f8c4e', '#22220f', '#a8202b'],
	['terracotta', '#c3663c', '#2a130a', '#f4e4c4'],
	['charcoal', '#201d1a', '#e8e0d0', '#dc9663'],
	['peacock', '#1f5f66', '#f0e8d4', '#e9c64c'],
	['lilac', '#bcaad2', '#2a2140', '#c3663c'],
	['moss', '#405c3b', '#ebe6cd', '#e2a73e'],
	['sky', '#b9d0da', '#1e2c3a', '#a8202b']
];

/** The colours of one binding, with the shades the drawings derive from them. */
export function palette(binding: number): Palette {
	const [name, ground, ink, accent] = BINDINGS[binding & 15];
	const wood = mix(ground, SOOT, 0.74);
	const dark = rgb(ground).reduce((s, v, k) => s + v * [0.2126, 0.7152, 0.0722][k], 0) / 255 < 0.3;
	return {
		name,
		ground,
		ink,
		accent,
		wood,
		void: mix(SOOT, ground, 0.08),
		rail: mix(ground, CREAM, 0.62),
		paper: mix(CREAM, ground, 0.3),
		tread: dark ? mix(ground, ink, 0.32) : mix(ground, CREAM, 0.42)
	};
}

/* ---------- address ---------- */

/** The book a raw page address (hex) belongs to, or null if the address is not plain hex. */
export function bookOf(rawAddressHex: string, script: ScriptCode): Book | null {
	if (!HEX.test(rawAddressHex)) return null;
	const number = BigInt(`0x${rawAddressHex}`) / BigInt(PAGES_PER_BOOK);
	const perShelf = BigInt(BOOKS_PER_SHELF);
	const perWall = perShelf * BigInt(SHELVES_PER_WALL);
	return {
		number,
		roomHex: (number / (perWall * BigInt(WALLS_PER_ROOM))).toString(16),
		wall: Number((number / perWall) % BigInt(WALLS_PER_ROOM)) + 1,
		shelf: Number((number / perShelf) % BigInt(SHELVES_PER_WALL)) + 1,
		slot: Number(number % perShelf) + 1,
		binding: Number(number & 15n),
		seed: fnv1a(`${script}:${number.toString(16)}`)
	};
}

/** A uniformly random raw page address (hex) in a library of alphabetSize^400 pages. */
export function randomAddress(alphabetSize: number, random: () => number = Math.random): string {
	let n = 0n;
	for (let i = 0; i < 800; i++) n = (n << 8n) | BigInt(Math.floor(random() * 256)); // 6,400 bits, more than any address
	return (n % BigInt(alphabetSize) ** BigInt(PAGE_CLUSTERS)).toString(16);
}

/** Raw addresses (page 1) of `count` books on this book's shelf, starting with it and wrapping after the last. */
export function shelfNeighbours(book: Book, count: number): { slot: number; address: string }[] {
	const first = book.number - BigInt(book.slot - 1);
	return Array.from({ length: count }, (_, k) => {
		const slot = ((book.slot - 1 + k) % BOOKS_PER_SHELF) + 1;
		return { slot, address: ((first + BigInt(slot - 1)) * BigInt(PAGES_PER_BOOK)).toString(16) };
	});
}

/** Wall (2 bits), shelf (3 bits) and book (5 bits) packed into three hex digits. */
export function callDigits(book: Book): number[] {
	const call = ((book.wall - 1) << 8) | ((book.shelf - 1) << 5) | (book.slot - 1);
	return [(call >> 8) & 15, (call >> 4) & 15, call & 15];
}

/** The digits a tape of `count` rows carries: the room number from the top, the call number last. */
export function tapeDigits(book: Book, count: number): number[] {
	const room = Array.from({ length: Math.max(0, count - 3) }, (_, i) => parseInt(book.roomHex[i] ?? '0', 16));
	return [...room, ...callDigits(book)];
}

const ZERO: Record<ScriptCode, number> = { kannada: 0x0ce6, telugu: 0x0c66, tamil: 0x0be6 };
/** CSS font-family for text in each script, as the layout loads it. */
export const FONTS: Record<ScriptCode, string> = {
	kannada: "'Noto Sans Kannada', sans-serif",
	telugu: "'Noto Sans Telugu', sans-serif",
	tamil: "'Noto Sans Tamil', sans-serif"
};

/** A number written in the script's own digits. */
export function scriptDigits(n: number, script: ScriptCode): string {
	return String(n).replace(/\d/g, (d) => String.fromCharCode(ZERO[script] + Number(d)));
}

/* ---------- the cover ---------- */

/** Hairline frame round the panel, with three empty ruled rows and a centre divider under it. */
function panel(stroke: string): string {
	const x0 = FR.x, x1 = FR.x + FR.w, y1 = FR.y + FR.h, yb = y1 + FR.rows * FR.rowH;
	let s = `<g fill="none" stroke="${stroke}" stroke-opacity=".55" stroke-width="1"><rect x="${x0}" y="${FR.y}" width="${FR.w}" height="${yb - FR.y}"/>`;
	for (let i = 0; i < FR.rows; i++) s += `<line x1="${x0}" x2="${x1}" y1="${y1 + i * FR.rowH}" y2="${y1 + i * FR.rowH}"/>`;
	return `${s}<line x1="${W / 2}" x2="${W / 2}" y1="${y1}" y2="${yb}"/></g>`;
}

/** Five strips of tape; across each, four hole positions (one per bit, high bit first) and a sprocket hole. */
const TAPE = { strips: 5, width: 46, gap: 12, pitch: 7.4, bits: [8, 16, 30, 38], hole: 2.3, sprocket: 23 };

interface TapeStrip {
	x: number;
	top: number;
	bottom: number;
	tilt: number;
	tail: number;
}

interface TapeRow {
	x: number;
	y: number;
	digit: number;
	/** One of the last three rows: wall, shelf and book. */
	call: boolean;
}

/** Offsets across a strip of the holes punched for one hex digit. */
const holesFor = (digit: number) => TAPE.bits.filter((_, b) => (digit >> (3 - b)) & 1);

/** Where the strips are cut and where each row of holes sits. The seed decides the cuts. */
function tapeLayout(book: Book): { strips: TapeStrip[]; rows: TapeRow[] } {
	const r = rng(book.seed);
	const x0 = W / 2 - (TAPE.strips * TAPE.width + (TAPE.strips - 1) * TAPE.gap) / 2;
	const strips = Array.from({ length: TAPE.strips }, (_, k) => {
		const top = FR.y + 10 + r() * 16, bottom = FR.y + FR.h - 10 - r() * 16;
		return { x: x0 + k * (TAPE.width + TAPE.gap), top, bottom, tilt: (r() - 0.5) * 10, tail: (r() - 0.5) * 10 };
	});
	const counts = strips.map((s) => Math.floor((s.bottom - s.top - 14) / TAPE.pitch));
	const digits = tapeDigits(book, counts.reduce((n, c) => n + c, 0));
	const rows: TapeRow[] = [];
	strips.forEach((s, k) => {
		for (let j = 0; j < counts[k]; j++) {
			const i = rows.length;
			rows.push({ x: s.x, y: s.top + 9 + j * TAPE.pitch, digit: digits[i], call: i >= digits.length - 3 });
		}
	});
	return { strips, rows };
}

/** Five strips of tape, four holes a row: the room's hex digits, then the book's call number in the accent. */
function tape(book: Book, C: Palette): string {
	const { strips, rows } = tapeLayout(book);
	let paper = '', holes = '', sprockets = '', marks = '';
	for (const s of strips) {
		paper += `<polygon points="${pts([[s.x, s.top + s.tilt], [s.x + TAPE.width, s.top - s.tilt], [s.x + TAPE.width, s.bottom - s.tail], [s.x, s.bottom + s.tail]])}"/>`;
	}
	for (const row of rows) {
		sprockets += disc(row.x + TAPE.sprocket, row.y, 1.1);
		for (const hx of holesFor(row.digit)) {
			if (row.call) marks += disc(row.x + hx, row.y, TAPE.hole);
			else holes += disc(row.x + hx, row.y, TAPE.hole);
		}
	}
	return (
		`<g fill="${C.paper}" stroke="${C.ink}" stroke-opacity=".3" stroke-width=".6">${paper}</g>` +
		`<path d="${sprockets}" fill="${C.void}" fill-opacity=".5"/>` +
		`<path d="${holes}" fill="${C.void}" fill-opacity=".85"/>` +
		`<path d="${marks}" fill="${C.accent}"/>`
	);
}

/**
 * Where a diagram's four numbered markers go on the cover (400 x 600 frame): on the first strip's room
 * digits, on the first hole of the call number, on the bare binding, and on the label.
 */
export function coverMarks(book: Book): Point[] {
	const { strips, rows } = tapeLayout(book);
	const first = strips[0];
	const call = rows.find((row) => row.call && holesFor(row.digit).length) ?? rows[rows.length - 1];
	return [
		[first.x + 13, first.top + first.tilt + 46],
		[call.x + (holesFor(call.digit)[0] ?? TAPE.bits[0]), call.y],
		[36, 80],
		[70, FR.y + FR.h + 12]
	];
}

/** The label rows: where the book stands, in the script's own words and digits. */
function label(book: Book, script: ScriptCode, C: Palette): CoverText[] {
	const s = SCRIPT_CONFIG[script], n = (x: number) => scriptDigits(x, script);
	const room = book.roomHex.length > 12 ? `${book.roomHex.slice(0, 6)}…${book.roomHex.slice(-4)}` : book.roomHex;
	const rows = [
		[`${s.wallLabel} ${n(book.wall)} · ${s.shelfLabel} ${n(book.shelf)}`, `${s.bookLabel} ${n(book.slot)}`],
		[`${s.mandiraLabel} ${room}`, `${s.pageLabel} ${n(1)}–${n(PAGES_PER_BOOK)}`],
		[s.title, '']
	];
	return rows.flatMap(([left, right], k) =>
		[left, right]
			.map((text, side) => ({ text, x: side ? W / 2 + 7 : FR.x + 7, y: FR.y + FR.h + k * FR.rowH + 13.6, size: 9, font: FONTS[script], fill: C.ink, opacity: 0.86 }))
			.filter((t) => t.text)
	);
}

/** The cover's shapes and, apart from them, its text, so an export can draw the text with the page's fonts. */
export function coverDrawing(book: Book, script: ScriptCode, { titled = true } = {}): { svg: string; text: CoverText[] } {
	const C = palette(book.binding);
	return {
		svg: `<rect width="${W}" height="${H}" fill="${C.ground}"/>${tape(book, C)}${panel(C.ink)}`,
		text: titled ? label(book, script, C) : []
	};
}

const textSvg = (items: CoverText[]) =>
	items
		.map((t) => `<text x="${f(t.x)}" y="${f(t.y)}" font-family="${esc(t.font)}" font-size="${t.size}" fill="${t.fill}" fill-opacity="${t.opacity}">${esc(t.text)}</text>`)
		.join('');

export interface CoverOptions {
	/** Label rows filled in (default true). */
	titled?: boolean;
	/** A stack of page edges behind the cover (default true); without it the SVG is exactly 400 x 600. */
	edges?: boolean;
	/** Text in the SVG (default true); an export leaves it out and draws it on a canvas. */
	text?: boolean;
}

/** The book's cover as a standalone SVG. */
export function coverSvg(book: Book, script: ScriptCode, { titled = true, edges = true, text = true }: CoverOptions = {}): string {
	const drawing = coverDrawing(book, script, { titled });
	const inner = drawing.svg + (text ? textSvg(drawing.text) : '');
	const aria = `Cover of book ${book.slot}, shelf ${book.shelf}, wall ${book.wall}: the room number punched on tape, ${palette(book.binding).name} binding`;
	if (!edges) {
		return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="${aria}">${inner}</svg>`;
	}
	let stack = '';
	for (let i = 6; i >= 1; i--) {
		stack += `<rect x="${f(i * 1.7)}" y="${f(i * 1.7)}" width="${W}" height="${H}" fill="#f1ece0" stroke="#8a8270" stroke-opacity=".5" stroke-width=".5"/>`;
	}
	return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W + 12} ${H + 12}" role="img" aria-label="${aria}">${stack}${inner}</svg>`;
}

/** The cover as a PNG, `scale` times 400 x 600, its text drawn with the page's loaded fonts. Browser only. */
export async function coverPng(book: Book, script: ScriptCode, scale = 6): Promise<Blob> {
	const image = new Image();
	image.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(coverSvg(book, script, { edges: false, text: false }))}`;
	await image.decode();
	const canvas = document.createElement('canvas');
	canvas.width = W * scale;
	canvas.height = H * scale;
	const ctx = canvas.getContext('2d');
	if (!ctx) throw new Error('No 2D canvas');
	ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
	const { text } = coverDrawing(book, script);
	await Promise.all(text.map((t) => document.fonts.load(`${t.size * scale}px ${t.font}`, t.text)));
	for (const t of text) {
		ctx.font = `${t.size * scale}px ${t.font}`;
		ctx.fillStyle = t.fill;
		ctx.globalAlpha = t.opacity;
		ctx.fillText(t.text, t.x * scale, t.y * scale);
	}
	return new Promise((resolve, reject) =>
		canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('Could not encode the cover'))), 'image/png')
	);
}

/* ---------- the stair ---------- */

/**
 * The book's stair, for the history list: a round well seen from above, its steps clinging to the wall round
 * an open centre, a couple of turns in sight or many. Every stair leans the same way; the seed sets the steps
 * per turn, the depth, the turning direction and where the top step starts.
 */
/** The stair's frame (100 x 100): the well's centre, its wall and open-centre radii, and how far the bottom sits low. */
const STAIR = { centre: [50, 50] as Point, outer: 40, inner: 22, lean: 3 };

interface StairLayout {
	/** Steps per turn. */
	K: number;
	turns: number;
	/** Steps in sight. */
	S: number;
	dir: 1 | -1;
	/** This book's step, one turn down. */
	mark: number;
	/** How much smaller step s looks than the top step. */
	p: (s: number) => number;
	/** Centre of the well at step s. */
	centre: (s: number) => Point;
	/** Angle where step s starts. */
	angle: (s: number) => number;
}

/** The stair's shape for a book: steps per turn, turns in sight, winding direction and where the top step starts. */
function stairLayout(book: Book): StairLayout {
	const r = rng(book.seed);
	const K = 14 + Math.floor(r() * 8), turns = 1.5 + r() * 6;
	const dir = r() < 0.5 ? 1 : -1, a0 = r() * TAU;
	const p = (s: number) => 1 / (1 + (0.75 * s) / K);
	return {
		K,
		turns,
		S: Math.round(turns * K),
		dir,
		mark: K + ((book.slot - 1) % K),
		p,
		centre: (s) => [STAIR.centre[0], STAIR.centre[1] + STAIR.lean * (1 - p(s))],
		angle: (s) => a0 + (dir * s * TAU) / K
	};
}

export function stairSvg(book: Book): string {
	const C = palette(book.binding), L = stairLayout(book), dA = TAU / L.K;
	const shade = (s: number) => 1 - L.p(s) ** 1.25;
	const arc = (c: Point, rad: number, from: number, to: number, n = 4) =>
		Array.from({ length: n }, (_, k) => polar(rad, from + ((to - from) * k) / (n - 1), c));

	let s = `<circle cx="50" cy="50" r="49" fill="${C.ground}"/>`;
	for (let z = 0; z <= L.S + L.K; z += L.K / 4) {
		const c = L.centre(z);
		s += `<circle cx="${f(c[0])}" cy="${f(c[1])}" r="${f(STAIR.outer * L.p(z))}" fill="${mix(C.wood, C.void, shade(z))}"/>`;
	}
	for (let k = L.S - 1; k >= 0; k--) {
		const c = L.centre(k), pk = L.p(k), t = shade(k);
		const from = L.angle(k), to = from + L.dir * dA * 1.04;
		const outer = arc(c, STAIR.outer * pk, from, to), inner = arc(c, STAIR.inner * pk, to, from);
		const tone = mix(k % 2 ? C.tread : mix(C.tread, C.wood, 0.14), C.void, t);
		s += `<polygon points="${pts([...outer, ...inner])}" fill="${k === L.mark ? C.accent : tone}"/>`;
		if (k < 2 * L.K) {
			s += `<polyline points="${pts(inner)}" fill="none" stroke="${C.rail}" stroke-opacity="${f(0.9 * (1 - t))}" stroke-width="${f(1.2 * pk)}"/>`;
		}
	}
	s += `<circle cx="50" cy="50" r="${STAIR.outer + 0.6}" fill="none" stroke="${C.ink}" stroke-opacity=".35" stroke-width=".8"/>`;
	return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" aria-hidden="true">${s}</svg>`;
}

export interface StairFacts {
	stepsPerTurn: number;
	turns: number;
	/** Seen from above, going down. */
	clockwise: boolean;
}

/** What the seed chose for a book's stair. */
export function stairFacts(book: Book): StairFacts {
	const L = stairLayout(book);
	return { stepsPerTurn: L.K, turns: L.turns, clockwise: L.dir > 0 };
}

/**
 * Where a diagram's four numbered markers go on the stair (100 x 100 frame): on the binding ring, on a step
 * half a turn from this book's (so the two never crowd), on this book's step, and at the bottom.
 */
export function stairMarks(book: Book): Point[] {
	const L = stairLayout(book), mid = (STAIR.outer + STAIR.inner) / 2;
	const onStep = (k: number) => polar(mid * L.p(k), L.angle(k) + (L.dir * Math.PI) / L.K, L.centre(k));
	return [polar(44.8, -2.4, STAIR.centre), onStep(L.mark - Math.round(L.K / 2)), onStep(L.mark), L.centre(L.S)];
}
