import { describe, expect, it, vi } from 'vitest';
import {
	countClusters,
	describeSearchFailure,
	findUnsupportedGraphemes,
	groupRuns,
	handleSubmitKey,
	layoutPageLines,
	normalizeQuery,
	truncateGraphemes,
	type PageLine
} from './text';

const VIRAMA = '್';

function lineText(line: PageLine): string {
	return line.map((token) => token.text).join('');
}

function markedText(lines: PageLine[]): string {
	return lines
		.flat()
		.filter((token) => token.marked)
		.map((token) => token.text)
		.join('');
}

function keyEvent(overrides: Partial<KeyboardEvent> = {}) {
	return { key: 'Enter', shiftKey: false, isComposing: false, preventDefault: vi.fn(), ...overrides };
}

describe('truncateGraphemes', () => {
	it('leaves short text alone', () => {
		expect(truncateGraphemes('ಕನ್ನಡ', 100)).toBe('ಕನ್ನಡ');
	});

	it('never cuts a conjunct after its virama', () => {
		// Each ಕ್ಷಾ is 4 code units; a 10-unit cut lands right after the virama of the third.
		expect(truncateGraphemes('ಕ್ಷಾ'.repeat(10), 10)).toBe('ಕ್ಷಾಕ್ಷಾ…');
	});

	it('never separates a consonant from its vowel sign', () => {
		expect(truncateGraphemes('ಕಾ'.repeat(10), 5)).toBe('ಕಾಕಾ…');
	});

	it('can drop the ellipsis', () => {
		expect(truncateGraphemes('ಕಾ'.repeat(10), 5, '')).toBe('ಕಾಕಾ');
	});
});

describe('normalizeQuery', () => {
	it('turns line breaks and tabs into spaces and trims the ends', () => {
		expect(normalizeQuery('  ಕನ್ನಡ\r\nನಾಡು\t')).toBe('ಕನ್ನಡ ನಾಡು');
	});

	it('composes to NFC', () => {
		// ಕ + ಿ + ೕ is the canonical decomposition of ಕೀ.
		expect(normalizeQuery('ಕೀ')).toBe('ಕೀ');
	});

	it('strips zero-width joiners the alphabet does not contain', () => {
		expect(normalizeQuery('ಕ್‍ಷ‌﻿')).toBe('ಕ್ಷ');
	});
});

describe('handleSubmitKey', () => {
	it('submits on Enter without inserting a newline', () => {
		const event = keyEvent();
		const submit = vi.fn();
		handleSubmitKey(event, submit);
		expect(submit).toHaveBeenCalledOnce();
		expect(event.preventDefault).toHaveBeenCalledOnce();
	});

	it('keeps Shift+Enter as a newline', () => {
		const event = keyEvent({ shiftKey: true });
		const submit = vi.fn();
		handleSubmitKey(event, submit);
		expect(submit).not.toHaveBeenCalled();
		expect(event.preventDefault).not.toHaveBeenCalled();
	});

	it('ignores Enter while an input method is composing', () => {
		const event = keyEvent({ isComposing: true });
		const submit = vi.fn();
		handleSubmitKey(event, submit);
		expect(submit).not.toHaveBeenCalled();
	});
});

describe('describeSearchFailure', () => {
	it('names the characters that are not in the alphabet', () => {
		const message = describeSearchFailure({ scriptName: 'Kannada', unsupported: ['h', 'e', 'l', 'o'], graphemeCount: 5 });
		expect(message).toContain('“h”');
		expect(message).toContain('“o”');
		expect(message).toContain('Kannada');
		expect(message).not.toMatch(/too long/i);
	});

	it('shows a stray vowel sign on a dotted circle', () => {
		const message = describeSearchFailure({ scriptName: 'Kannada', unsupported: ['ಾ'], graphemeCount: 1 });
		expect(message).toContain('“◌ಾ”');
	});

	it('caps a long list of characters', () => {
		const unsupported = 'abcdefghijklmnop'.split('');
		const message = describeSearchFailure({ scriptName: 'Tamil', unsupported, graphemeCount: 16 });
		expect(message).toContain('and 6 more');
		expect(message).not.toContain('“p”');
	});

	it('uses the real page size when the text is too long', () => {
		const message = describeSearchFailure({ scriptName: 'Kannada', unsupported: [], graphemeCount: 900 });
		expect(message).toContain('400');
		expect(message).toContain('900');
		expect(message).not.toContain('410');
	});

	it('falls back to an unsupported-combination message', () => {
		const message = describeSearchFailure({ scriptName: 'Telugu', unsupported: [], graphemeCount: 12 });
		expect(message).toMatch(/combination/);
		expect(message).toContain('Telugu');
	});
});

describe('findUnsupportedGraphemes', () => {
	it('returns each unsupported grapheme once, in order, skipping spaces', async () => {
		const isSupported = vi.fn(async (grapheme: string) => !/[a-z]/.test(grapheme));
		const result = await findUnsupportedGraphemes('hello ಕನ್ನಡ hello', isSupported);
		expect(result).toEqual(['h', 'e', 'l', 'o']);
		expect(isSupported).not.toHaveBeenCalledWith(' ');
		expect(isSupported.mock.calls.filter(([grapheme]) => grapheme === 'l')).toHaveLength(1);
	});
});

describe('layoutPageLines', () => {
	const lineA = 'ಕಾಕಿಕೀ';
	const lineB = 'ಗಾಗಿಗೀ';

	it('keeps every line intact with nothing marked when there is no query', () => {
		const lines = layoutPageLines(`${lineA}\n${lineB}`, '');
		expect(lines.map(lineText)).toEqual([lineA, lineB]);
		expect(markedText(lines)).toBe('');
	});

	it('marks a match that runs across a line break', () => {
		const lines = layoutPageLines(`${lineA}\n${lineB}`, 'ಕೀಗಾ');
		expect(lines.map(lineText)).toEqual([lineA, lineB]);
		expect(markedText(lines)).toBe('ಕೀಗಾ');
		expect(lines[0].at(-1)).toMatchObject({ text: 'ಕೀ', marked: true });
		expect(lines[1][0]).toMatchObject({ text: 'ಗಾ', marked: true });
	});

	it('only allows line breaks between clusters, never after a virama', () => {
		const line = 'ಕ್ಷಾರ್ನ್ಗ್ಗಿ';
		const [tokens] = layoutPageLines(line, '');
		expect(lineText(tokens)).toBe(line);
		for (const token of tokens.filter((t) => t.breakAfter)) {
			expect(token.text.endsWith(VIRAMA)).toBe(false);
		}
		expect(tokens.some((t) => t.breakAfter)).toBe(true);
	});

	it('prefers a whole-cluster match over one inside another cluster', () => {
		// The first ಕ sits inside ಕೆ; the standalone ಕ comes later.
		const lines = layoutPageLines('ಕೆಗಾಕಗಿ', 'ಕ');
		const marked = lines[0].filter((t) => t.marked);
		expect(marked.map((t) => t.text)).toEqual(['ಕ']);
		expect(lineText(lines[0].slice(0, lines[0].indexOf(marked[0])))).toBe('ಕೆಗಾ');
	});
});

describe('countClusters', () => {
	it('counts a conjunct as one cluster, the way the engine does', () => {
		expect(countClusters('ಷ್ಯ')).toBe(1);
		expect(countClusters('ಕ್ಷಾ')).toBe(1);
		expect(countClusters('క్ష')).toBe(1);
		expect(countClusters('க்ஷ')).toBe(1);
	});

	it('counts spaces and vowel-signed letters once each', () => {
		// ಮ ನು ಷ್ಯ ␣ ಜಾ ತಿ ␣ ತಾ ನೊಂ ದೆ ␣ ವ ಲಂ
		expect(countClusters('ಮನುಷ್ಯ ಜಾತಿ ತಾನೊಂದೆ ವಲಂ')).toBe(13);
	});

	it('is zero for empty text', () => {
		expect(countClusters('')).toBe(0);
	});
});

describe('groupRuns', () => {
	it('puts a whole match in one run, so it gets one highlight box', () => {
		// Separate boxes per cluster let each background paint over its neighbour's subjoined consonant.
		const [line] = layoutPageLines('ಳ್ಞನನ್ನ ಆಸೆ ಮಸಾಲ', 'ನನ್ನ ಆಸೆ ಮಸಾ');
		const runs = groupRuns(line);
		expect(runs.map((run) => run.marked)).toEqual([false, true, false]);
		expect(runs[1].tokens.map((token) => token.text).join('')).toBe('ನನ್ನ ಆಸೆ ಮಸಾ');
	});

	it('keeps every token and its wrap point', () => {
		const [line] = layoutPageLines('ಕನ್ನಡ ಭಾಷೆ', 'ಕನ್ನಡ');
		expect(groupRuns(line).flatMap((run) => run.tokens)).toEqual(line);
	});

	it('returns a single unmarked run when nothing matches', () => {
		const [line] = layoutPageLines('ಕನ್ನಡ', '');
		expect(groupRuns(line)).toEqual([{ marked: false, tokens: line }]);
	});
});
