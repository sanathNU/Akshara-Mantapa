import { describe, expect, it } from 'vitest';
import { formatPercent, shortAddress, timeAgo } from './format';

const NOW = Date.UTC(2026, 10, 20, 12, 0);
const MINUTE = 60_000;

describe('timeAgo', () => {
	it('says just now inside the first minute', () => {
		expect(timeAgo(NOW - 20_000, NOW)).toBe('just now');
	});

	it('counts minutes, hours and days', () => {
		expect(timeAgo(NOW - 4 * MINUTE, NOW)).toBe('4 min ago');
		expect(timeAgo(NOW - 3 * 60 * MINUTE, NOW)).toBe('3 h ago');
		expect(timeAgo(NOW - 2 * 24 * 60 * MINUTE, NOW)).toBe('2 d ago');
	});

	it('falls back to a date after a week', () => {
		expect(timeAgo(Date.UTC(2026, 9, 1, 12, 0), NOW)).toMatch(/Oct/);
	});
});

describe('shortAddress', () => {
	it('keeps wall, shelf, book and page from a full address', () => {
		expect(shortAddress('3eb643ee.4.3.30.399')).toBe('4.3.30, p. 399');
	});

	it('returns anything else unchanged', () => {
		expect(shortAddress('3eb643ee')).toBe('3eb643ee');
	});
});

describe('formatPercent', () => {
	it('shows two decimals', () => {
		expect(formatPercent(0.146748)).toBe('14.67%');
	});

	it('never rounds a page that is in the library down to zero', () => {
		expect(formatPercent(0.00000003)).toBe('less than 0.01%');
		expect(formatPercent(0)).toBe('0.00%');
	});
});
