// Small display helpers for the page notes and the history list.

const MINUTE = 60_000;

/** "just now", "4 min ago", "3 h ago", "2 d ago", then a short date. */
export function timeAgo(timestamp: number, now = Date.now()): string {
	const minutes = Math.floor((now - timestamp) / MINUTE);
	if (minutes < 1) return 'just now';
	if (minutes < 60) return `${minutes} min ago`;
	const hours = Math.floor(minutes / 60);
	if (hours < 24) return `${hours} h ago`;
	const days = Math.floor(hours / 24);
	if (days < 7) return `${days} d ago`;
	return new Date(timestamp).toLocaleDateString('en', { day: 'numeric', month: 'short', year: 'numeric' });
}

/** "4.3.30, p. 399" from a display address that ends in wall.shelf.book.page. */
export function shortAddress(displayAddress: string): string {
	const parts = displayAddress.split('.');
	if (parts.length < 5) return displayAddress;
	const [wall, shelf, book, page] = parts.slice(-4);
	return `${wall}.${shelf}.${book}, p. ${page}`;
}

/** A fraction as a percentage with two decimals, never rounding a real position to 0.00%. */
export function formatPercent(fraction: number): string {
	const percent = fraction * 100;
	if (percent > 0 && percent < 0.01) return 'less than 0.01%';
	return `${percent.toFixed(2)}%`;
}
