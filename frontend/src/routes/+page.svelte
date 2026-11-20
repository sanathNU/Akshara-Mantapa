<script lang="ts">
	import { onMount, tick } from 'svelte';
	import { base } from '$app/paths';
	import {
		getRandomPage,
		getPageByAddress,
		getNextPage,
		getPreviousPage,
		searchText,
		DEFAULT_SCRIPT_CODE,
		SCRIPT_CONFIG,
		type Page,
		type ScriptCode
	} from '$lib/api';
	import {
		countClusters,
		describeSearchFailure,
		findUnsupportedGraphemes,
		graphemes,
		groupRuns,
		handleSubmitKey,
		layoutPageLines,
		normalizeQuery,
		truncateGraphemes
	} from '$lib/text';
	import { PAGES_PER_BOOK, libraryExponent, libraryPosition, pagesHoldingExponent } from '$lib/library';
	import { formatPercent, shortAddress, timeAgo } from '$lib/format';
	import IntroPicture from '$lib/components/IntroPicture.svelte';
	import RoomPlan from '$lib/components/RoomPlan.svelte';
	import ThemeToggle from '$lib/components/ThemeToggle.svelte';

	interface HistoryEntry {
		address: string;
		displayAddress: string;
		preview: string;
		timestamp: number;
	}

	interface ShowOptions {
		highlight?: string;
		remember?: boolean;
		scroll?: boolean;
	}

	type Busy = '' | 'loading' | 'searching' | 'navigating';

	const scripts = Object.values(SCRIPT_CONFIG);
	const MAX_HISTORY = 50;
	const HISTORY_PREVIEW = 6;
	const ROOM_SNIPPET = 9;
	const backendHint = import.meta.env.DEV ? ' Is the backend running?' : '';

	let scriptCode = $state<ScriptCode>(DEFAULT_SCRIPT_CODE);
	let currentPage = $state<Page | null>(null);
	let foundQuery = $state('');
	let query = $state('');
	let address = $state('');
	let showAddress = $state(false);
	let busy = $state<Busy>('');
	let error = $state('');
	let info = $state('');
	let notice = $state('');
	let history = $state<HistoryEntry[]>([]);
	let showAllHistory = $state(false);
	let roomNameShown = $state(false);
	let isAtFirstPage = $state(false);
	let downloadingBook = $state(false);
	let downloadProgress = $state(0);
	let now = $state(Date.now());
	let pageSection: HTMLElement | undefined = $state();
	let noticeTimer: ReturnType<typeof setTimeout> | undefined;

	const script = $derived(SCRIPT_CONFIG[scriptCode]);
	const where = $derived(currentPage?.hierarchical);
	const lines = $derived(currentPage ? layoutPageLines(currentPage.formatted_content, foundQuery) : []);
	const foundLine = $derived(lines.findIndex((line) => line.some((token) => token.marked)) + 1);
	const libraryPower = $derived(Math.floor(libraryExponent(script.alphabetSize)));
	const holding = $derived(foundLine ? pagesHoldingExponent(countClusters(foundQuery), script.alphabetSize) : null);
	const position = $derived(currentPage ? libraryPosition(currentPage.raw_address, script.alphabetSize) : null);
	const roomName = $derived(where?.mandira_kannada ? layoutPageLines(where.mandira_kannada, '')[0] : []);
	const shownHistory = $derived(showAllHistory ? history : history.slice(0, HISTORY_PREVIEW));

	onMount(() => {
		const params = new URLSearchParams(location.search);
		const linkedScript = params.get('s');
		if (linkedScript && linkedScript in SCRIPT_CONFIG) scriptCode = linkedScript as ScriptCode;
		history = readHistory(SCRIPT_CONFIG[scriptCode].historyKey);

		const linked = params.get('p');
		if (linked) {
			show(() => getPageByAddress(linked, scriptCode), "Couldn't open the linked page.", 'loading', {
				highlight: normalizeQuery(params.get('q') ?? ''),
				scroll: false
			});
		} else {
			show(() => getRandomPage(scriptCode), "Couldn't open a page.", 'loading', { remember: false, scroll: false });
		}

		const clock = setInterval(() => (now = Date.now()), 60_000);
		return () => clearInterval(clock);
	});

	/** Grow the search box with its text instead of scrolling inside it. */
	function autosize(node: HTMLTextAreaElement, _value: string) {
		const fit = () => {
			node.style.height = 'auto';
			node.style.height = `${node.scrollHeight}px`;
		};
		fit();
		return { update: fit };
	}

	function readHistory(key: string): HistoryEntry[] {
		try {
			const parsed: unknown = JSON.parse(localStorage.getItem(key) ?? '[]');
			return Array.isArray(parsed) ? (parsed as HistoryEntry[]) : [];
		} catch {
			return [];
		}
	}

	function saveHistory() {
		try {
			localStorage.setItem(script.historyKey, JSON.stringify(history));
		} catch {
			// Storage can be full or disabled; history then lasts for this visit only.
		}
	}

	function addToHistory(page: Page) {
		const entry: HistoryEntry = {
			address: page.raw_address,
			displayAddress: page.hierarchical.display_string,
			preview: truncateGraphemes(page.content, 50, ''),
			timestamp: Date.now()
		};
		history = [entry, ...history.filter((item) => item.address !== page.raw_address)].slice(0, MAX_HISTORY);
		saveHistory();
	}

	function clearHistory() {
		history = [];
		saveHistory();
	}

	function switchScript(code: ScriptCode) {
		if (code === scriptCode || busy || downloadingBook) return;
		scriptCode = code;
		currentPage = null;
		foundQuery = '';
		query = '';
		address = '';
		error = '';
		info = '';
		showAddress = false;
		showAllHistory = false;
		history = readHistory(SCRIPT_CONFIG[code].historyKey);
		show(() => getRandomPage(code), "Couldn't load a random page.", 'loading', { remember: false, scroll: false });
	}

	/** Scroll `element` into view unless its top is already in the upper half of the screen. */
	function reveal(element: HTMLElement | undefined) {
		if (!element) return;
		const { top } = element.getBoundingClientRect();
		if (top >= 0 && top <= window.innerHeight * 0.5) return;
		const smooth = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
		element.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto', block: 'start' });
	}

	function checkIfFirstPage(page: Page): boolean {
		const h = page.hierarchical;
		return h.mandira_hex === '0' && h.gode === 1 && h.patti === 1 && h.pustaka === 1 && h.puta === 1;
	}

	async function present(page: Page, { highlight = '', remember = true, scroll = true }: ShowOptions) {
		currentPage = page;
		foundQuery = highlight;
		roomNameShown = false;
		isAtFirstPage = checkIfFirstPage(page);
		if (remember) addToHistory(page);
		if (scroll) {
			await tick();
			reveal(pageSection);
		}
	}

	/** Fetch a page and show it; a null result means there is no earlier page. */
	async function show(fetchPage: () => Promise<Page | null>, failure: string, mode: Busy, options: ShowOptions = {}) {
		if (busy) return;
		busy = mode;
		error = '';
		info = '';
		try {
			const page = await fetchPage();
			if (page) await present(page, options);
			else isAtFirstPage = true;
		} catch (e) {
			error = failure + backendHint;
			console.error(e);
		} finally {
			busy = '';
		}
	}

	function loadRandomPage() {
		show(() => getRandomPage(scriptCode), "Couldn't load a random page.", 'loading');
	}

	function loadPageByAddress() {
		const target = address.trim();
		if (!target) {
			error = 'Enter an address first.';
			return;
		}
		show(
			() => getPageByAddress(target, scriptCode),
			"Couldn't load that address. Use a hex address or room.wall.shelf.book.page.",
			'loading'
		);
	}

	function loadNextPage() {
		const from = currentPage;
		if (!from) return;
		show(() => getNextPage(from.raw_address, scriptCode), "Couldn't load the next page.", 'navigating');
	}

	function loadPreviousPage() {
		const from = currentPage;
		if (!from || isAtFirstPage) return;
		show(() => getPreviousPage(from.raw_address, scriptCode), "Couldn't load the previous page.", 'navigating');
	}

	function loadFromHistory(entry: HistoryEntry) {
		show(() => getPageByAddress(entry.address, scriptCode), "Couldn't load that page from history.", 'loading');
	}

	function performSearch() {
		runSearch(normalizeQuery(query));
	}

	/** Place `text` on a page; every run picks a new random spot, so a new address. */
	async function runSearch(text: string) {
		if (!text) {
			error = 'Type something to search for.';
			return;
		}
		if (busy) return;
		busy = 'searching';
		error = '';
		info = '';
		try {
			const response = await searchText(text, scriptCode);
			if (response.found && response.location) {
				const page = await getPageByAddress(response.location.raw_address, scriptCode);
				await present(page, { highlight: text });
			} else {
				const unsupported = await findUnsupportedGraphemes(
					text,
					async (grapheme) => (await searchText(grapheme, scriptCode)).found
				);
				info = describeSearchFailure({ scriptName: script.name, unsupported, graphemeCount: graphemes(text).length });
			}
		} catch (e) {
			error = 'Search failed.' + backendHint;
			console.error(e);
		} finally {
			busy = '';
		}
	}

	function flash(message: string) {
		notice = message;
		clearTimeout(noticeTimer);
		noticeTimer = setTimeout(() => (notice = ''), 2000);
	}

	async function copy(text: string, done: string) {
		try {
			await navigator.clipboard.writeText(text);
			flash(done);
		} catch (e) {
			console.error('Failed to copy:', e);
			flash("Couldn't copy");
		}
	}

	/** A link that opens this page, in this script, with the found text still highlighted. */
	function pageLink(page: Page): string {
		const url = new URL(`${base}/`, location.origin);
		url.searchParams.set('s', scriptCode);
		url.searchParams.set('p', page.raw_address);
		if (foundLine) url.searchParams.set('q', foundQuery);
		return url.href;
	}

	function saveText(text: string, filename: string) {
		const url = URL.createObjectURL(new Blob([text], { type: 'text/plain;charset=utf-8' }));
		const anchor = document.createElement('a');
		anchor.href = url;
		anchor.download = filename;
		anchor.click();
		URL.revokeObjectURL(url);
	}

	function downloadPage() {
		if (!currentPage) return;
		const h = currentPage.hierarchical;
		saveText(
			`Akshara-Mantapa Page
====================

Location:
- Mandira: ${h.mandira_hex}
- Gode (Wall): ${h.gode}
- Patti (Shelf): ${h.patti}
- Pustaka (Book): ${h.pustaka}
- Puta (Page): ${h.puta}

Address: ${h.display_string}

Content:
${currentPage.formatted_content}
`,
			`akshara-mantapa-page-${h.puta}.txt`
		);
	}

	async function downloadBook() {
		if (!currentPage || downloadingBook) return;
		if (!confirm('This will generate and download all 410 pages of this book. This may take a minute. Continue?')) return;

		downloadingBook = true;
		downloadProgress = 0;
		try {
			const h = currentPage.hierarchical;
			let book = `Akshara-Mantapa Book
====================
Mandira: ${h.mandira_hex}
Gode (Wall): ${h.gode}
Patti (Shelf): ${h.patti}
Pustaka (Book): ${h.pustaka}

`;
			let pageAddress = `${h.mandira_hex}.${h.gode}.${h.patti}.${h.pustaka}.1`;
			for (let i = 1; i <= PAGES_PER_BOOK; i++) {
				downloadProgress = Math.round((i / PAGES_PER_BOOK) * 100);
				const page = await getPageByAddress(pageAddress, scriptCode);
				book += `
--- Page ${i} ---
${page.formatted_content}

`;
				if (i < PAGES_PER_BOOK) pageAddress = (await getNextPage(pageAddress, scriptCode)).raw_address;
				if (i % 10 === 0) await new Promise((resolve) => setTimeout(resolve, 10));
			}
			saveText(book, `akshara-mantapa-book-${h.pustaka}.txt`);
		} catch (e) {
			error = 'Failed to download book.';
			console.error(e);
		} finally {
			downloadingBook = false;
			downloadProgress = 0;
		}
	}
</script>

<svelte:head>
	<title>{script.title} · {script.productName}</title>
</svelte:head>

<div class="wrap">
	<div class="panel">
		<div class="ptop">
			<nav class="switch" aria-label="Script">
				{#each scripts as option, i (option.code)}
					{#if i > 0}<span class="sep" aria-hidden="true">·</span>{/if}
					<button
						type="button"
						class:on={option.code === scriptCode}
						lang={option.lang}
						aria-pressed={option.code === scriptCode}
						disabled={!!busy || downloadingBook}
						onclick={() => switchScript(option.code)}>{option.nativeName}</button
					>
				{/each}
			</nav>
			<ThemeToggle />
		</div>

		<div class="ptitle">
			<IntroPicture
				src="{base}/main-picture.jpg"
				alt="A robed figure walks toward a lit doorway between towering shelves of books"
				heading={script.title}
				subtitle="{script.productName} · {script.description}"
				lang={script.lang}
			/>
			<h1><span class="title" lang={script.lang}>{script.title}</span> <span class="sc">{script.productName}</span></h1>
		</div>

		<div class="field">
			<label class="lab sc" for="find">Find</label>
			<textarea
				id="find"
				rows="1"
				bind:value={query}
				use:autosize={query}
				lang={script.lang}
				placeholder="type or paste {script.name} text"
				onkeydown={(event) => handleSubmitKey(event, performSearch)}
			></textarea>
		</div>
		{#if showAddress}
			<form
				class="field"
				onsubmit={(event) => {
					event.preventDefault();
					loadPageByAddress();
				}}
			>
				<label class="lab sc" for="address">Address</label>
				<input id="address" bind:value={address} placeholder="hex, or room.wall.shelf.book.page" spellcheck="false" autocomplete="off" />
				<button class="br" type="submit" disabled={!!busy}>go</button>
			</form>
		{/if}

		<div class="cmds">
			<button class="br" type="button" onclick={performSearch} disabled={!!busy}>
				{busy === 'searching' ? 'searching…' : 'search'}
			</button>
			<button class="br" type="button" onclick={loadRandomPage} disabled={!!busy}>random page</button>
			<button class="br" type="button" onclick={() => (showAddress = !showAddress)} aria-expanded={showAddress}>
				go to address
			</button>
			<a class="br" href="{base}/about/">about</a>
			<a class="br" href="{base}/info/">info</a>
		</div>

		<p class="help">{script.intro}</p>
		<p class="help">
			{script.alphabetSize.toLocaleString('en')} aksharas, 400 to a page, {PAGES_PER_BOOK} pages to a book: 10<sup
				>{libraryPower}</sup
			> pages in all.
		</p>
	</div>

	{#if error}
		<p class="status error col" role="alert">{error}</p>
	{/if}
	{#if info}
		<p class="status col" role="status">{info}</p>
	{/if}
	{#if busy === 'loading' && !currentPage}
		<p class="status col" role="status">Opening a page…</p>
	{/if}

	{#if currentPage && where}
		{#if foundLine}
			<p class="found col">
				<b>Found on line {foundLine}.</b>
				{#if holding === null}
					This text is on this page.
				{:else if holding < 6}
					{Math.round(10 ** holding).toLocaleString('en')} pages in the library hold this text.
				{:else}
					About 10<sup>{Math.floor(holding)}</sup> pages in the library hold this text.
				{/if}
				<button type="button" class="link" onclick={() => runSearch(foundQuery)} disabled={!!busy}>
					Show me another one
				</button>
			</p>
		{/if}

		<section class="page" class:after-found={foundLine > 0} bind:this={pageSection} aria-label="Page {where.puta}">
			<div class="main">
				<div class="sheet" class:dim={busy === 'navigating' || busy === 'searching'}>
					<div class="loc">
						<div class="crumb">
							<span lang={script.lang}>{script.mandiraLabel}</span><sup><a href="#room-note" aria-label="About the room">1</a></sup>
							<span class="sep" aria-hidden="true">›</span><span lang={script.lang}>{script.wallLabel}</span>
							{where.gode}
							<span class="sep" aria-hidden="true">›</span><span lang={script.lang}>{script.shelfLabel}</span>
							{where.patti}
							<span class="sep" aria-hidden="true">›</span><span lang={script.lang}>{script.bookLabel}</span>
							{where.pustaka}
						</div>
						<div class="pager">
							<button
								type="button"
								class="arr"
								onclick={loadPreviousPage}
								disabled={!!busy || isAtFirstPage}
								aria-label="Previous page"
								title={isAtFirstPage ? 'This is the first page' : 'Previous page'}>‹</button
							>
							<span><span lang={script.lang}>{script.pageLabel}</span> {where.puta} <span class="of">/ {PAGES_PER_BOOK}</span></span>
							<button type="button" class="arr" onclick={loadNextPage} disabled={!!busy} aria-label="Next page" title="Next page"
								>›</button
							>
						</div>
					</div>

					<div class="pg" lang={script.lang}>
						{#each lines as line, i}
							<div class="l">
								<span class="n" aria-hidden="true">{(i + 1) % 5 === 0 ? i + 1 : ''}</span>{#each groupRuns(line) as run}{#if run.marked}<mark
											>{#each run.tokens as token}{token.text}{#if token.breakAfter}<wbr />{/if}{/each}</mark
										>{:else}{#each run.tokens as token}{token.text}{#if token.breakAfter}<wbr />{/if}{/each}{/if}{/each}
							</div>
						{/each}
					</div>

					<div class="acts">
						<button class="br" type="button" onclick={() => copy(pageLink(currentPage!), 'Link copied')}>copy link</button>
						<button class="br" type="button" onclick={() => copy(where.display_string, 'Address copied')}>copy address</button>
						<button class="br" type="button" onclick={downloadPage}>download page</button>
						<button class="br" type="button" onclick={downloadBook} disabled={downloadingBook}>
							{downloadingBook ? `downloading ${downloadProgress}%` : 'download book'}
						</button>
						<span class="notice" role="status">{notice}</span>
					</div>
				</div>

				{#if roomNameShown && roomName.length}
					<div class="room-name">
						<div class="room-head">
							<span class="sc">The room’s full name</span>
							<span class="room-cmds">
								<button class="br" type="button" onclick={() => copy(where.mandira_kannada ?? '', 'Name copied')}>copy</button>
								<button class="br" type="button" onclick={() => (roomNameShown = false)}>hide</button>
							</span>
						</div>
						<p lang={script.lang}>
							{#each roomName as token}{token.text}{#if token.breakAfter}<wbr />{/if}{/each}
						</p>
					</div>
				{/if}
			</div>

			<aside class="side">
				<RoomPlan wall={where.gode} shelf={where.patti} book={where.pustaka} />
				<p class="figcap sc">
					wall {where.gode}<span class="sep" aria-hidden="true">·</span>shelf {where.patti}<span class="sep" aria-hidden="true"
						>·</span
					>book {where.pustaka}
				</p>
				{#if roomName.length}
					<p class="note" id="room-note">
						<sup>1</sup><span lang={script.lang}>{script.mandiraLabel}</span>, the room. Its full name runs to {roomName.length.toLocaleString(
							'en'
						)} aksharas:
						<span lang={script.lang}
							>{#each roomName.slice(0, ROOM_SNIPPET) as token}{token.text}<wbr />{/each}…</span
						>
						<button type="button" class="link" onclick={() => (roomNameShown = !roomNameShown)}>
							{roomNameShown ? 'Hide it' : 'Show it'}
						</button>
					</p>
				{/if}
				<p class="note">
					As a number the room is <span class="hex">{where.mandira_hex.slice(0, 4)}…{where.mandira_hex.slice(-4)}</span>,
					{where.mandira_hex.length.toLocaleString('en')} hex digits long.
				</p>
				{#if position !== null}
					<p class="note">
						{#if position.fraction >= 0.0001}
							This page sits {formatPercent(position.fraction)} of the way into the library.
						{:else if position.log10 === -Infinity}
							This is the library’s very first page.
						{:else}
							This page sits only 10<sup>−{Math.round(-position.log10).toLocaleString('en')}</sup> of the way into the library.
						{/if}
						A page picked at random is this one with odds of 1 in 10<sup>{libraryPower}</sup>.
					</p>
				{/if}
			</aside>
		</section>
	{/if}

	<section class="hist col" aria-label="Pages you’ve opened">
		<div class="hist-head">
			<h2>Pages you’ve opened</h2>
			{#if history.length}
				<button class="br" type="button" onclick={clearHistory}>clear</button>
			{/if}
		</div>
		{#if history.length === 0}
			<p class="empty">None yet. Pages you open or find show up here.</p>
		{:else}
			{#each shownHistory as entry (entry.address)}
				<button type="button" class="row" onclick={() => loadFromHistory(entry)} disabled={!!busy}>
					<span class="addr">{shortAddress(entry.displayAddress)}</span>
					<span class="snip" lang={script.lang}>{entry.preview}…</span>
					<span class="t">{timeAgo(entry.timestamp, now)}</span>
				</button>
			{/each}
			{#if history.length > HISTORY_PREVIEW}
				<button class="br more" type="button" onclick={() => (showAllHistory = !showAllHistory)}>
					{showAllHistory ? 'show fewer' : `show all ${history.length}`}
				</button>
			{/if}
		{/if}
	</section>

	<footer class="col">
		<span>Every page is computed in your browser.</span>
		<span class="sc">
			<a href="https://en.wikipedia.org/wiki/The_Library_of_Babel" target="_blank" rel="noopener">Borges, 1941</a><span
				class="sep"
				aria-hidden="true">·</span
			><a href="https://github.com/sanathNU" target="_blank" rel="noopener">GitHub</a><span class="sep" aria-hidden="true">·</span><a
				href="https://sanathnu.github.io/TechnicaInsania/"
				target="_blank"
				rel="noopener">Made by Sanath</a
			>
		</span>
	</footer>
</div>

<style>
	.wrap {
		max-width: 1218px;
		margin: 0 auto;
		padding: 0 40px;
	}

	.col {
		max-width: 840px;
	}

	/* Header panel: script switch, title, find box, commands. */
	.panel {
		max-width: 600px;
		margin-top: 28px;
		border: 1px solid var(--frame);
		padding: 12px 20px 16px;
	}

	.ptop {
		display: flex;
		justify-content: space-between;
		align-items: center;
		font-size: 18px;
	}

	.ptitle {
		display: flex;
		align-items: center;
		gap: 6px 14px;
		margin-top: 10px;
	}

	h1 {
		display: flex;
		align-items: baseline;
		flex-wrap: wrap;
		gap: 2px 14px;
		margin: 0;
		font-size: inherit;
		font-weight: 400;
		line-height: 1.3;
	}

	h1 .title {
		font-size: 26px;
		font-weight: 500;
	}

	h1 .sc {
		font-size: 22px;
		letter-spacing: 0.12em;
	}

	.field {
		display: flex;
		align-items: baseline;
		gap: 14px;
		margin-top: 10px;
		padding: 2px 0 6px;
		border-bottom: 1px solid var(--rule-strong);
	}

	.field:focus-within {
		border-bottom-color: var(--ink);
	}

	.lab {
		flex: none;
		font-size: 18px;
		color: var(--ink-soft);
	}

	.field textarea,
	.field input {
		flex: 1;
		min-width: 0;
		padding: 0;
		border: 0;
		background: none;
		color: var(--ink);
		outline: none;
	}

	.field textarea {
		font-size: 21px;
		line-height: 1.5;
		resize: none;
		overflow: hidden;
	}

	.field textarea::placeholder,
	.field input::placeholder {
		color: var(--muted);
		opacity: 1;
		font-family: var(--serif);
		font-size: 21px;
	}

	.field input {
		font: 16px/1.5 var(--mono);
	}

	.cmds {
		display: flex;
		flex-wrap: wrap;
		gap: 2px 18px;
		margin-top: 10px;
		font-size: 20px;
	}

	.help {
		margin: 10px 0 0;
		font-size: 18px;
		line-height: 1.5;
		color: var(--ink-soft);
	}

	.status {
		margin: 28px 0 0;
		font-size: 20px;
		color: var(--ink-soft);
	}

	.status.error {
		color: var(--warm);
	}

	.found {
		margin: 40px 0 0;
		font-size: 21px;
	}

	.found b {
		font-weight: 600;
	}

	/* The page: a tinted sheet, with notes and the room plan in the margin. */
	.page {
		display: grid;
		grid-template-columns: minmax(0, 840px) 250px;
		column-gap: 48px;
		margin-top: 40px;
	}

	.page.after-found {
		margin-top: 12px;
	}

	.main {
		min-width: 0;
	}

	.sheet {
		padding: 0 18px;
		border: 1px solid var(--paper-line);
		background: var(--paper);
		transition: opacity 0.15s ease;
	}

	.sheet.dim {
		opacity: 0.55;
		pointer-events: none;
	}

	.loc {
		display: flex;
		justify-content: space-between;
		align-items: baseline;
		flex-wrap: wrap;
		gap: 4px 16px;
		padding: 10px 0 8px;
		border-bottom: 1px solid var(--paper-line);
		font-size: 20px;
	}

	.crumb [lang],
	.pager [lang] {
		font-size: 17px;
		margin-right: 0.15em;
	}

	.crumb sup a {
		color: var(--warm);
		text-decoration: none;
		margin-left: 0.1em;
	}

	.pager {
		display: flex;
		align-items: baseline;
		gap: 4px;
		margin-left: auto;
		white-space: nowrap;
	}

	.of {
		color: var(--muted);
	}

	.arr {
		background: none;
		border: 0;
		padding: 0 8px;
		font-size: 26px;
		line-height: 1;
		cursor: pointer;
	}

	.arr:hover:not(:disabled) {
		color: var(--warm);
	}

	.arr:disabled {
		color: var(--muted);
		cursor: default;
	}

	/* 16px lets the widest measured 25-cluster Kannada line (46.9em) fit the 768px measure;
	   Tamil clusters run about twice as wide, so Tamil lines wrap with a hanging indent. */
	.pg {
		padding: 14px 0 14px 36px;
		font-size: 16px;
		line-height: 1.95;
	}

	.l {
		position: relative;
		padding-left: 1.2em;
		text-indent: -1.2em;
	}

	.n {
		position: absolute;
		left: -36px;
		width: 22px;
		text-align: right;
		text-indent: 0;
		font-family: var(--serif);
		font-size: 15px;
		color: var(--muted);
	}

	/* The highlight is blended under the ink, like a highlighter pen, so it never hides the
	   subjoined consonants and vowel signs that Kannada letters hang into their neighbours. */
	mark {
		background: var(--mark);
		color: var(--mark-ink);
		box-shadow: 0 0 0 2px var(--mark);
		mix-blend-mode: multiply;
		-webkit-box-decoration-break: clone;
		box-decoration-break: clone;
	}

	:global([data-theme='dark']) mark {
		mix-blend-mode: screen;
	}

	.acts {
		display: flex;
		flex-wrap: wrap;
		align-items: baseline;
		gap: 2px 18px;
		padding: 8px 0 10px;
		border-top: 1px solid var(--paper-line);
		font-size: 19px;
	}

	.notice {
		color: var(--warm);
	}

	.room-name {
		margin-top: 14px;
		padding: 10px 16px 12px;
		border: 1px solid var(--paper-line);
		background: var(--paper);
		font-size: 18px;
	}

	.room-head {
		display: flex;
		justify-content: space-between;
		gap: 12px;
		color: var(--ink-soft);
	}

	.room-cmds {
		display: flex;
		gap: 14px;
	}

	.room-name p {
		margin: 6px 0 0;
		font-size: 15px;
		line-height: 1.75;
	}

	.side {
		padding-top: 64px;
		font-size: 17px;
		line-height: 1.5;
		color: var(--ink-soft);
	}

	.figcap {
		margin: 4px 0 22px;
		font-size: 16px;
		color: var(--muted);
	}

	.note {
		margin: 0 0 16px;
	}

	.note > sup:first-child {
		margin-right: 0.2em;
		color: var(--warm);
	}

	.hex {
		font-family: var(--mono);
		font-size: 0.8em;
	}

	/* History: an index of opened pages. */
	.hist {
		margin-top: 72px;
	}

	.hist-head {
		display: flex;
		justify-content: space-between;
		align-items: baseline;
		margin-bottom: 6px;
	}

	h2 {
		margin: 0;
		font-size: 24px;
		font-weight: 600;
	}

	.hist-head .br {
		font-size: 18px;
		color: var(--ink-soft);
	}

	.empty {
		margin: 0;
		padding: 8px 0;
		border-top: 1px solid var(--rule);
		font-size: 19px;
		color: var(--muted);
	}

	.row {
		display: grid;
		grid-template-columns: 170px minmax(0, 1fr) auto;
		gap: 20px;
		align-items: baseline;
		width: 100%;
		padding: 8px 0;
		border: 0;
		border-top: 1px solid var(--rule);
		background: none;
		font-size: 19px;
		text-align: left;
		cursor: pointer;
	}

	.row:hover:not(:disabled) .addr {
		color: var(--warm);
	}

	.row:disabled {
		cursor: default;
	}

	.addr {
		text-decoration: underline 1px var(--rule-strong);
		text-underline-offset: 0.18em;
	}

	.snip {
		overflow: hidden;
		white-space: nowrap;
		text-overflow: ellipsis;
		font-size: 16px;
		color: var(--ink-soft);
	}

	.t {
		color: var(--muted);
	}

	.more {
		margin-top: 8px;
		font-size: 18px;
		color: var(--ink-soft);
	}

	footer {
		display: flex;
		justify-content: space-between;
		flex-wrap: wrap;
		gap: 6px 20px;
		margin-top: 64px;
		padding: 16px 0 36px;
		border-top: 1px solid var(--rule);
		font-size: 18px;
		color: var(--muted);
	}

	@media (max-width: 1179px) {
		.wrap {
			max-width: 910px;
		}

		.page {
			grid-template-columns: minmax(0, 1fr);
		}

		.pg {
			font-size: clamp(14px, calc((100vw - 152px) / 48), 16px);
		}

		.side {
			margin-top: 18px;
			padding-top: 14px;
			border-top: 1px solid var(--rule);
			font-size: 17px;
		}

		.note {
			margin-bottom: 8px;
		}
	}

	@media (max-width: 720px) {
		.wrap {
			padding: 0 18px;
		}

		.panel {
			padding: 10px 14px 14px;
		}

		.help {
			font-size: 17px;
		}

		.cmds {
			font-size: 19px;
		}

		.field textarea {
			font-size: 19px;
		}

		.sheet {
			padding: 0 10px;
		}

		.pg {
			padding-left: 26px;
			font-size: 14px;
		}

		.n {
			left: -26px;
			width: 16px;
			font-size: 13px;
		}

		.row {
			grid-template-columns: 1fr auto;
		}

		.snip {
			display: none;
		}
	}
</style>
