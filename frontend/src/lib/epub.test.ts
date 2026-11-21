import { describe, expect, it } from 'vitest';
import { buildEpub, crc32, zip, type EpubInput } from './epub';

const text = (s: string) => new TextEncoder().encode(s);
const read = (b: Uint8Array) => new TextDecoder().decode(b);

interface Entry {
	name: string;
	method: number;
	extra: number;
	crc: number;
	data: Uint8Array;
}

/** Read a ZIP back through its central directory, the way an unzipper does. */
function unzip(file: Uint8Array): Entry[] {
	const view = new DataView(file.buffer, file.byteOffset, file.byteLength);
	const end = file.byteLength - 22;
	expect(view.getUint32(end, true)).toBe(0x06054b50);
	const count = view.getUint16(end + 10, true);
	let at = view.getUint32(end + 16, true);
	const entries: Entry[] = [];
	for (let i = 0; i < count; i++) {
		expect(view.getUint32(at, true)).toBe(0x02014b50);
		const nameLength = view.getUint16(at + 28, true);
		const local = view.getUint32(at + 42, true);
		const name = read(file.subarray(at + 46, at + 46 + nameLength));
		expect(view.getUint32(local, true)).toBe(0x04034b50);
		const size = view.getUint32(local + 18, true);
		const extra = view.getUint16(local + 28, true);
		const start = local + 30 + view.getUint16(local + 26, true) + extra;
		entries.push({ name, method: view.getUint16(local + 8, true), extra, crc: view.getUint32(local + 14, true), data: file.subarray(start, start + size) });
		at += 46 + nameLength + view.getUint16(at + 30, true) + view.getUint16(at + 32, true);
	}
	return entries;
}

const KN_DIGITS = (n: number) => String(n).replace(/\d/g, (d) => String.fromCharCode(0x0ce6 + Number(d)));

function input(overrides: Partial<EpubInput> = {}): EpubInput {
	return {
		id: 'urn:akshara-mantapa:kannada:9f3a.3.2.17',
		title: 'ಪುಸ್ತಕ ೧೭',
		creator: 'ಅಕ್ಷರ ಮಂಟಪ',
		language: 'kn',
		description: 'Book 17 <of 32> & more',
		pageLabel: 'ಪುಟ',
		digits: KN_DIGITS,
		contentsTitle: 'ಪರಿವಿಡಿ',
		font: "'Noto Sans Kannada', sans-serif",
		modified: '2026-11-20T12:00:00Z',
		pages: Array.from({ length: 410 }, (_, i) => `ಕಖಗ<${i + 1}>&\nಘಙಚ`),
		cover: new Uint8Array([0x89, 0x50, 0x4e, 0x47]),
		...overrides
	};
}

describe('crc32', () => {
	it('matches the standard check value', () => {
		expect(crc32(text('123456789'))).toBe(0xcbf43926);
	});
});

describe('zip', () => {
	it('stores every file whole, with its CRC, readable through the central directory', () => {
		const files = [
			{ name: 'a.txt', data: text('hello') },
			{ name: 'dir/b.xhtml', data: text('ಅಕ್ಷರ') }
		];
		const entries = unzip(zip(files, new Date(2026, 10, 20, 12, 0, 0)));
		expect(entries.map((e) => e.name)).toEqual(['a.txt', 'dir/b.xhtml']);
		for (const [i, e] of entries.entries()) {
			expect(e.method).toBe(0);
			expect(e.data).toEqual(files[i].data);
			expect(e.crc).toBe(crc32(files[i].data));
		}
	});
});

describe('buildEpub', () => {
	const entries = unzip(buildEpub(input()));
	const file = (name: string) => read(entries.find((e) => e.name === name)!.data);

	it('starts with an uncompressed mimetype, as the EPUB container requires', () => {
		expect(entries[0]).toMatchObject({ name: 'mimetype', method: 0, extra: 0 });
		expect(read(entries[0].data)).toBe('application/epub+zip');
	});

	it('points the container at the package document', () => {
		expect(file('META-INF/container.xml')).toContain('full-path="OEBPS/content.opf"');
	});

	it('puts ten pages in a chapter, all 410 in the spine after the cover', () => {
		const chapters = entries.filter((e) => /^OEBPS\/p\d{3}\.xhtml$/.test(e.name));
		expect(chapters).toHaveLength(41);
		const spine = [...file('OEBPS/content.opf').matchAll(/<itemref idref="([^"]+)"/g)].map((m) => m[1]);
		expect(spine[0]).toBe('cover');
		expect(spine.filter((id) => /^p\d{3}$/.test(id))).toHaveLength(41);
		expect(file('OEBPS/p041.xhtml')).toContain('ಪುಟ ೪೧೦');
	});

	it('marks the cover image for readers old and new', () => {
		const opf = file('OEBPS/content.opf');
		expect(opf).toMatch(/<item id="cover-image" href="cover.png" media-type="image\/png" properties="cover-image"\/>/);
		expect(opf).toContain('<meta name="cover" content="cover-image"/>');
		expect(entries.find((e) => e.name === 'OEBPS/cover.png')!.data).toEqual(new Uint8Array([0x89, 0x50, 0x4e, 0x47]));
	});

	it('escapes the text and keeps each line', () => {
		const page = file('OEBPS/p001.xhtml');
		expect(page).toContain('ಕಖಗ&lt;1&gt;&amp;<br/>ಘಙಚ');
		expect(file('OEBPS/content.opf')).toContain('Book 17 &lt;of 32&gt; &amp; more');
		for (const e of entries.filter((x) => x.name.endsWith('.xhtml') || x.name.endsWith('.opf'))) {
			expect(read(e.data)).not.toMatch(/&(?!amp;|lt;|gt;|quot;|#\d+;)/);
		}
	});

	it('lists every chapter in the contents', () => {
		const nav = file('OEBPS/nav.xhtml');
		expect(nav).toContain('epub:type="toc"');
		expect(nav.match(/<li>/g)).toHaveLength(41);
		expect(nav).toContain('ಪುಟ ೪೦೧–೪೧೦');
	});

	it('leaves the cover out when there is none', () => {
		const names = unzip(buildEpub(input({ cover: undefined }))).map((e) => e.name);
		expect(names).not.toContain('OEBPS/cover.png');
		expect(names).not.toContain('OEBPS/cover.xhtml');
	});
});
