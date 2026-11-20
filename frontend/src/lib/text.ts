// Text helpers for the library UI: grapheme-safe truncation, search input handling,
// search failure messages, and splitting a page into lines that wrap between clusters.

/** Clusters on one page; mirrors CLUSTERS_PER_PAGE in backend/src/constants.rs. */
export const PAGE_CLUSTERS = 400;

/** Punctuation every script's alphabet carries besides the space (backend/src/engine/*.rs). */
const ALPHABET_PUNCTUATION = '. , ! ? ।';

const MAX_LISTED_CHARACTERS = 10;
const MAX_CHECKED_GRAPHEMES = 200;

/** Kannada, Telugu and Tamil viramas: a cluster ending in one joins the next consonant. */
const VIRAMAS = new Set(['್', '్', '்']);

const graphemeSegmenter = new Intl.Segmenter(undefined, { granularity: 'grapheme' });

/** One run of page text: `breakAfter` marks a place the browser may wrap the line. */
export interface PageToken {
	text: string;
	marked: boolean;
	breakAfter: boolean;
}

export type PageLine = PageToken[];

/** Consecutive tokens of a line that are all marked or all unmarked. */
export interface PageRun {
	marked: boolean;
	tokens: PageToken[];
}

export interface SearchFailure {
	scriptName: string;
	unsupported: string[];
	graphemeCount: number;
}

type SubmitKeyEvent = Pick<KeyboardEvent, 'key' | 'shiftKey' | 'isComposing' | 'preventDefault'>;

interface MatchRange {
	start: number;
	end: number;
}

/** Split text into user-perceived characters (extended grapheme clusters). */
export function graphemes(text: string): string[] {
	return Array.from(graphemeSegmenter.segment(text), (s) => s.segment);
}

function endsWithVirama(text: string): boolean {
	return VIRAMAS.has(text.at(-1) ?? '');
}

/**
 * Count text the way the engine counts it: one cluster per grapheme, except that a
 * grapheme ending in a virama joins the next one (ಷ್ + ಯ is the single cluster ಷ್ಯ).
 */
export function countClusters(text: string): number {
	let count = 0;
	let joinsNext = false;
	for (const grapheme of graphemes(text)) {
		if (!joinsNext) count++;
		joinsNext = endsWithVirama(grapheme);
	}
	return count;
}

/**
 * Clean up search input: line breaks and tabs become spaces, invisible joiners the
 * alphabet does not contain are dropped, and the result is NFC with no outer spaces.
 */
export function normalizeQuery(query: string): string {
	return query
		.replace(/\r\n|[\r\n\t ]/g, ' ')
		.replace(/[‌‍﻿]/g, '')
		.normalize('NFC')
		.trim();
}

/**
 * Shorten text to at most `maxCodeUnits` UTF-16 code units, cutting only between
 * grapheme clusters and never right after a virama (which would turn a conjunct
 * into a bare half-form). Appends `ellipsis` when anything was cut.
 */
export function truncateGraphemes(text: string, maxCodeUnits: number, ellipsis = '…'): string {
	if (text.length <= maxCodeUnits) return text;

	const kept: string[] = [];
	let length = 0;
	for (const grapheme of graphemes(text)) {
		if (length + grapheme.length > maxCodeUnits) break;
		kept.push(grapheme);
		length += grapheme.length;
	}
	while (kept.length > 0 && endsWithVirama(kept[kept.length - 1])) kept.pop();
	return kept.join('') + ellipsis;
}

/** Run `submit` on Enter, without the newline a textarea would otherwise insert. */
export function handleSubmitKey(event: SubmitKeyEvent, submit: () => void): void {
	if (event.key !== 'Enter' || event.shiftKey || event.isComposing) return;
	event.preventDefault();
	submit();
}

function showGrapheme(grapheme: string): string {
	// A lone vowel sign or virama renders on a dotted circle, as type specimens show them.
	return /^\p{M}/u.test(grapheme) ? `“◌${grapheme}”` : `“${grapheme}”`;
}

/** Explain why a search could not place the text, in plain words. */
export function describeSearchFailure({ scriptName, unsupported, graphemeCount }: SearchFailure): string {
	if (unsupported.length > 0) {
		const listed = unsupported.slice(0, MAX_LISTED_CHARACTERS).map(showGrapheme).join(', ');
		const extra = unsupported.length - MAX_LISTED_CHARACTERS;
		const more = extra > 0 ? ` and ${extra} more` : '';
		return `Can't search for ${listed}${more}: the ${scriptName} library only has ${scriptName} letters, spaces and ${ALPHABET_PUNCTUATION}`;
	}
	if (graphemeCount > PAGE_CLUSTERS) {
		return `Too long for one page: a page holds ${PAGE_CLUSTERS} letters and this has about ${graphemeCount}.`;
	}
	return `Couldn't place this text: it has a letter combination the ${scriptName} alphabet doesn't include.`;
}

/**
 * Ask `isSupported` about each distinct non-space grapheme of `query` and return the
 * ones it rejects, in order of first appearance. Used only after a search fails, to
 * point at the characters responsible.
 */
export async function findUnsupportedGraphemes(
	query: string,
	isSupported: (grapheme: string) => Promise<boolean>
): Promise<string[]> {
	const distinct = [...new Set(graphemes(query))].filter((g) => g.trim() !== '').slice(0, MAX_CHECKED_GRAPHEMES);
	const verdicts = await Promise.all(distinct.map((grapheme) => isSupported(grapheme)));
	return distinct.filter((_, i) => !verdicts[i]);
}

/** Offsets where grapheme clusters start or end in `text`. */
function graphemeBoundaries(text: string): Set<number> {
	const boundaries = new Set<number>([0]);
	let offset = 0;
	for (const grapheme of graphemes(text)) {
		offset += grapheme.length;
		boundaries.add(offset);
	}
	return boundaries;
}

/**
 * Locate `query` in `text`, preferring an occurrence that starts and ends on cluster
 * boundaries (a one-letter query also matches inside longer clusters).
 */
function findMatch(text: string, query: string): MatchRange | null {
	if (!query) return null;
	const boundaries = graphemeBoundaries(text);
	let first: MatchRange | null = null;
	for (let i = text.indexOf(query); i !== -1; i = text.indexOf(query, i + 1)) {
		const range = { start: i, end: i + query.length };
		if (boundaries.has(range.start) && boundaries.has(range.end)) return range;
		first ??= range;
	}
	return first;
}

/** Cut points inside a line: wrap opportunities between clusters plus match edges. */
function lineCuts(line: string, match: MatchRange | null): { cuts: number[]; breaks: Set<number> } {
	const breaks = new Set<number>();
	let offset = 0;
	for (const grapheme of graphemes(line)) {
		offset += grapheme.length;
		if (offset < line.length && !endsWithVirama(grapheme)) breaks.add(offset);
	}
	const cuts = new Set(breaks);
	if (match) {
		for (const edge of [match.start, match.end]) if (edge > 0 && edge < line.length) cuts.add(edge);
	}
	return { cuts: [...cuts].sort((a, b) => a - b), breaks };
}

/**
 * Group a line's tokens into runs, so a match is drawn as one highlight box. With one box
 * per cluster, each box's background paints over the subjoined consonant or vowel sign
 * that the cluster before it hangs into the next one.
 */
export function groupRuns(line: PageLine): PageRun[] {
	const runs: PageRun[] = [];
	for (const token of line) {
		const last = runs.at(-1);
		if (last && last.marked === token.marked) last.tokens.push(token);
		else runs.push({ marked: token.marked, tokens: [token] });
	}
	return runs;
}

/**
 * Split engine-formatted page text (lines joined by "\n") into tokens per line.
 * Matches of `query` are marked even when they run across a line break, and line
 * wrapping is only allowed between clusters, never inside a conjunct.
 */
export function layoutPageLines(formatted: string, query: string): PageLine[] {
	const lines = formatted.split('\n');
	const match = findMatch(lines.join(''), query);

	let lineStart = 0;
	return lines.map((line) => {
		const localMatch = match ? { start: match.start - lineStart, end: match.end - lineStart } : null;
		lineStart += line.length;

		const { cuts, breaks } = lineCuts(line, localMatch);
		const edges = [0, ...cuts, line.length];
		const tokens: PageLine = [];
		for (let i = 0; i < edges.length - 1; i++) {
			const [from, to] = [edges[i], edges[i + 1]];
			if (from === to) continue;
			const marked = localMatch !== null && from >= localMatch.start && to <= localMatch.end;
			tokens.push({ text: line.slice(from, to), marked, breakAfter: breaks.has(to) });
		}
		return tokens;
	});
}
