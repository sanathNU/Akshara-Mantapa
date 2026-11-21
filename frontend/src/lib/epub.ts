// epub.ts: a book as an EPUB 3 file, built in the browser. The cover image comes first, then the pages,
// ten to a chapter, with a contents page listing the chapters. The files go into a plain ZIP with no
// compression, the EPUB container (OCF 3.0 §4.2: `mimetype` first, stored, no extra field). The reader
// shapes and wraps the text itself, so conjuncts and vowel signs come out as they do on the site.
//
// No imports on purpose: Node can load this file directly to write an EPUB for checking outside a browser.

export interface EpubInput {
	/** dc:identifier, a URN unique to the book. */
	id: string;
	title: string;
	creator: string;
	/** BCP 47 code of the text: kn, te, ta. */
	language: string;
	description?: string;
	/** The word for "page", for headings like "ಪುಟ ೧" and chapters like "ಪುಟ ೧–೧೦". */
	pageLabel: string;
	/** A number in the text's own digits. */
	digits: (n: number) => string;
	/** Heading of the contents page. */
	contentsTitle: string;
	/** CSS font-family for the text; readers fall back to their own fonts for the script. */
	font: string;
	/** dcterms:modified, as CCYY-MM-DDThh:mm:ssZ. */
	modified: string;
	/** Each page's text, lines separated by newlines. */
	pages: string[];
	/** The cover as PNG bytes. */
	cover?: Uint8Array;
}

export interface ZipFile {
	name: string;
	data: Uint8Array;
}

const PAGES_PER_CHAPTER = 10;

/* ---------- ZIP ---------- */

const CRC_TABLE = (() => {
	const table = new Uint32Array(256);
	for (let n = 0; n < 256; n++) {
		let c = n;
		for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
		table[n] = c >>> 0;
	}
	return table;
})();

/** CRC-32 (IEEE 802.3), as ZIP records it for every file. */
export function crc32(data: Uint8Array): number {
	let c = 0xffffffff;
	for (let i = 0; i < data.length; i++) c = CRC_TABLE[(c ^ data[i]) & 0xff] ^ (c >>> 8);
	return (c ^ 0xffffffff) >>> 0;
}

function concat(parts: Uint8Array[]): Uint8Array<ArrayBuffer> {
	const out = new Uint8Array(parts.reduce((n, p) => n + p.length, 0));
	let at = 0;
	for (const p of parts) {
		out.set(p, at);
		at += p.length;
	}
	return out;
}

/** A ZIP archive with every file stored as is, in the order given. Names must be ASCII. */
export function zip(files: ZipFile[], date = new Date()): Uint8Array<ArrayBuffer> {
	const time = (date.getHours() << 11) | (date.getMinutes() << 5) | (date.getSeconds() >> 1);
	const day = ((date.getFullYear() - 1980) << 9) | ((date.getMonth() + 1) << 5) | date.getDate();
	const ascii = new TextEncoder();
	const body: Uint8Array[] = [], directory: Uint8Array[] = [];
	let offset = 0;
	for (const file of files) {
		const name = ascii.encode(file.name), crc = crc32(file.data), size = file.data.length;
		const local = new DataView(new ArrayBuffer(30));
		local.setUint32(0, 0x04034b50, true);
		local.setUint16(4, 10, true); // version needed: 1.0, stored
		local.setUint16(10, time, true);
		local.setUint16(12, day, true);
		local.setUint32(14, crc, true);
		local.setUint32(18, size, true);
		local.setUint32(22, size, true);
		local.setUint16(26, name.length, true);
		body.push(new Uint8Array(local.buffer), name, file.data);

		const entry = new DataView(new ArrayBuffer(46));
		entry.setUint32(0, 0x02014b50, true);
		entry.setUint16(4, 20, true); // made by: 2.0
		entry.setUint16(6, 10, true);
		entry.setUint16(12, time, true);
		entry.setUint16(14, day, true);
		entry.setUint32(16, crc, true);
		entry.setUint32(20, size, true);
		entry.setUint32(24, size, true);
		entry.setUint16(28, name.length, true);
		entry.setUint32(42, offset, true);
		directory.push(new Uint8Array(entry.buffer), name);
		offset += 30 + name.length + size;
	}
	const directorySize = directory.reduce((n, p) => n + p.length, 0);
	const end = new DataView(new ArrayBuffer(22));
	end.setUint32(0, 0x06054b50, true);
	end.setUint16(8, files.length, true);
	end.setUint16(10, files.length, true);
	end.setUint32(12, directorySize, true);
	end.setUint32(16, offset, true);
	return concat([...body, ...directory, new Uint8Array(end.buffer)]);
}

/* ---------- EPUB ---------- */

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function xhtml(lang: string, title: string, body: string, bodyClass = ''): string {
	return (
		`<?xml version="1.0" encoding="UTF-8"?>\n<!DOCTYPE html>\n` +
		`<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops" xml:lang="${lang}" lang="${lang}">\n` +
		`<head><meta charset="UTF-8"/><title>${esc(title)}</title><link rel="stylesheet" type="text/css" href="book.css"/></head>\n` +
		`<body${bodyClass ? ` class="${bodyClass}"` : ''}>\n${body}\n</body>\n</html>\n`
	);
}

const chapterName = (i: number) => `p${String(i + 1).padStart(3, '0')}`;

/** The book as the bytes of an .epub file. */
export function buildEpub(book: EpubInput): Uint8Array<ArrayBuffer> {
	const utf8 = new TextEncoder();
	const L = book.language;
	const pageTitle = (n: number) => `${book.pageLabel} ${book.digits(n)}`;
	const chapters = Array.from({ length: Math.ceil(book.pages.length / PAGES_PER_CHAPTER) }, (_, c) => {
		const first = c * PAGES_PER_CHAPTER + 1;
		const last = Math.min(book.pages.length, first + PAGES_PER_CHAPTER - 1);
		return { name: chapterName(c), first, last, title: `${book.pageLabel} ${book.digits(first)}–${book.digits(last)}` };
	});

	const files: ZipFile[] = [
		{ name: 'mimetype', data: utf8.encode('application/epub+zip') },
		{
			name: 'META-INF/container.xml',
			data: utf8.encode(
				`<?xml version="1.0" encoding="UTF-8"?>\n<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">\n` +
					`<rootfiles><rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/></rootfiles>\n</container>\n`
			)
		},
		{
			name: 'OEBPS/book.css',
			data: utf8.encode(
				`body { margin: 0 5%; font-family: ${book.font}; line-height: 1.8; }\n` +
					`h2 { margin: 1.2em 0 .6em; font-size: .8em; font-weight: normal; letter-spacing: .06em; color: #7d7166; }\n` +
					`section.page { break-before: page; page-break-before: always; }\n` +
					`section.page:first-child { break-before: auto; page-break-before: auto; }\n` +
					`p.lines { margin: 0; overflow-wrap: anywhere; word-break: break-all; }\n` +
					`body.cover { margin: 0; padding: 0; text-align: center; }\n` +
					`body.cover img { max-width: 100%; max-height: 100%; }\n` +
					`nav ol { list-style: none; padding: 0; }\n`
			)
		}
	];

	const manifest = [
		`<item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav"/>`,
		`<item id="css" href="book.css" media-type="text/css"/>`
	];
	const spine: string[] = [];
	if (book.cover) {
		files.push({ name: 'OEBPS/cover.png', data: book.cover });
		files.push({ name: 'OEBPS/cover.xhtml', data: utf8.encode(xhtml(L, book.title, `<img src="cover.png" alt="${esc(book.title)}"/>`, 'cover')) });
		manifest.push(`<item id="cover-image" href="cover.png" media-type="image/png" properties="cover-image"/>`);
		manifest.push(`<item id="cover" href="cover.xhtml" media-type="application/xhtml+xml"/>`);
		spine.push(`<itemref idref="cover"/>`);
	}
	spine.push(`<itemref idref="nav" linear="no"/>`);

	for (const ch of chapters) {
		const sections = book.pages.slice(ch.first - 1, ch.last).map((text, k) => {
			const n = ch.first + k;
			const lines = text.split('\n').map(esc).join('<br/>');
			return `<section class="page" id="page-${n}" aria-label="${esc(pageTitle(n))}"><h2>${esc(pageTitle(n))}</h2><p class="lines">${lines}</p></section>`;
		});
		files.push({ name: `OEBPS/${ch.name}.xhtml`, data: utf8.encode(xhtml(L, ch.title, sections.join('\n'))) });
		manifest.push(`<item id="${ch.name}" href="${ch.name}.xhtml" media-type="application/xhtml+xml"/>`);
		spine.push(`<itemref idref="${ch.name}"/>`);
	}

	const toc = chapters.map((ch) => `<li><a href="${ch.name}.xhtml#page-${ch.first}">${esc(ch.title)}</a></li>`).join('\n');
	files.push({
		name: 'OEBPS/nav.xhtml',
		data: utf8.encode(xhtml(L, book.contentsTitle, `<nav epub:type="toc" id="toc"><h1>${esc(book.contentsTitle)}</h1>\n<ol>\n${toc}\n</ol></nav>`))
	});

	const opf =
		`<?xml version="1.0" encoding="UTF-8"?>\n` +
		`<package xmlns="http://www.idpf.org/2007/opf" version="3.0" unique-identifier="book-id" xml:lang="${L}">\n` +
		`<metadata xmlns:dc="http://purl.org/dc/elements/1.1/">\n` +
		`<dc:identifier id="book-id">${esc(book.id)}</dc:identifier>\n` +
		`<dc:title>${esc(book.title)}</dc:title>\n<dc:creator>${esc(book.creator)}</dc:creator>\n<dc:language>${L}</dc:language>\n` +
		(book.description ? `<dc:description>${esc(book.description)}</dc:description>\n` : '') +
		`<meta property="dcterms:modified">${book.modified}</meta>\n` +
		(book.cover ? `<meta name="cover" content="cover-image"/>\n` : '') +
		`</metadata>\n<manifest>\n${manifest.join('\n')}\n</manifest>\n<spine>\n${spine.join('\n')}\n</spine>\n</package>\n`;
	files.push({ name: 'OEBPS/content.opf', data: utf8.encode(opf) });

	return zip(files, new Date(book.modified));
}
