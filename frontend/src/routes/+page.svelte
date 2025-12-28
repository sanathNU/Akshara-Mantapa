<script lang="ts">
	import { onMount } from 'svelte';
	import { base } from '$app/paths';
	import {
		getRandomPage,
		getPageByAddress,
		getNextPage,
		getPreviousPage,
		searchText,
		searchTextRandom,
		type Page,
		type LocationResponse
	} from '$lib/api';

	let currentPage: Page | null = null;
	let searchLocation: LocationResponse | null = null;
	let searchResultPage: Page | null = null;
	let searchQuery = '';
	let searchInfo = '';
	let loading = false;
	let navigating = false;
	let error = '';
	let address = '';
	let copyMessage = '';
	let lastSearchedText = '';
	let isRandomSearch = false;
	let searchExpanded = false;
	let isAtFirstPage = false;

	// History state
	let history: Array<{
		address: string;
		displayAddress: string;
		preview: string;
		timestamp: number;
	}> = [];
	let showHistory = false;
	const MAX_HISTORY = 50;

	// Download state
	let downloadingBook = false;
	let downloadProgress = 0;

	onMount(() => {
		const saved = localStorage.getItem('akshara-mantapa-history');
		if (saved) {
			try {
				history = JSON.parse(saved);
			} catch (e) {
				console.error('Failed to load history:', e);
			}
		}
	});

	function addToHistory(page: Page) {
		const entry = {
			address: page.raw_address,
			displayAddress: page.hierarchical.display_string,
			preview: page.content.slice(0, 50),
			timestamp: Date.now()
		};
		
		history = history.filter(h => h.address !== page.raw_address);
		history = [entry, ...history].slice(0, MAX_HISTORY);
		localStorage.setItem('akshara-mantapa-history', JSON.stringify(history));
	}

	async function loadFromHistory(addr: string) {
		showHistory = false;
		try {
			loading = true;
			error = '';
			searchLocation = null;
			searchResultPage = null;
			lastSearchedText = '';
			currentPage = await getPageByAddress(addr);
			isAtFirstPage = checkIfFirstPage(currentPage);
		} catch (e) {
			error = 'Failed to load page from history.';
			console.error(e);
		} finally {
			loading = false;
		}
	}

	function clearHistory() {
		history = [];
		localStorage.removeItem('akshara-mantapa-history');
	}

	function formatTimestamp(ts: number): string {
		const date = new Date(ts);
		return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
	}

	function downloadPage() {
		if (!currentPage) return;
		
		const content = `Akshara-Mantapa Page
====================

Location:
- Mandira: ${currentPage.hierarchical.mandira_hex}
- Gode (Wall): ${currentPage.hierarchical.gode}
- Patti (Shelf): ${currentPage.hierarchical.patti}
- Pustaka (Book): ${currentPage.hierarchical.pustaka}
- Puta (Page): ${currentPage.hierarchical.puta}

Address: ${currentPage.hierarchical.display_string}

Content:
${currentPage.formatted_content}
`;
		
		const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = `akshara-mantapa-page-${currentPage.hierarchical.puta}.txt`;
		a.click();
		URL.revokeObjectURL(url);
	}

	async function downloadBook() {
		if (!currentPage || downloadingBook) return;
		
		const confirmed = confirm(
			'This will generate and download all 410 pages of this book. This may take a minute. Continue?'
		);
		if (!confirmed) return;
		
		downloadingBook = true;
		downloadProgress = 0;
		
		try {
			const baseAddr = currentPage.hierarchical;
			let bookContent = `Akshara-Mantapa Book
====================
Mandira: ${baseAddr.mandira_hex}
Gode (Wall): ${baseAddr.gode}
Patti (Shelf): ${baseAddr.patti}
Pustaka (Book): ${baseAddr.pustaka}

`;
			
			const bookStartAddress = `${baseAddr.mandira_hex}.${baseAddr.gode}.${baseAddr.patti}.${baseAddr.pustaka}.1`;
			let currentAddr = bookStartAddress;
			
			for (let i = 1; i <= 410; i++) {
				downloadProgress = Math.round((i / 410) * 100);
				
				const page = await getPageByAddress(currentAddr);
				
				bookContent += `
--- Page ${i} ---
${page.formatted_content}

`;
				
				if (i < 410) {
					const nextPage = await getNextPage(currentAddr);
					currentAddr = nextPage.raw_address;
				}
				
				if (i % 10 === 0) {
					await new Promise(resolve => setTimeout(resolve, 10));
				}
			}
			
			const blob = new Blob([bookContent], { type: 'text/plain;charset=utf-8' });
			const url = URL.createObjectURL(blob);
			const a = document.createElement('a');
			a.href = url;
			a.download = `akshara-mantapa-book-${baseAddr.pustaka}.txt`;
			a.click();
			URL.revokeObjectURL(url);
			
		} catch (e) {
			error = 'Failed to download book.';
			console.error(e);
		} finally {
			downloadingBook = false;
			downloadProgress = 0;
		}
	}

	function copyToClipboard(text: string) {
		navigator.clipboard.writeText(text).then(() => {
			copyMessage = 'Copied!';
			setTimeout(() => copyMessage = '', 2000);
		}).catch(err => {
			console.error('Failed to copy:', err);
			copyMessage = 'Failed to copy';
			setTimeout(() => copyMessage = '', 2000);
		});
	}

	function truncateMandira(text: string, maxLines: number = 2): string {
		const charsPerLine = 50;
		const maxChars = charsPerLine * maxLines;
		if (text.length <= maxChars) return text;
		return text.substring(0, maxChars) + '...';
	}

	function checkIfFirstPage(page: Page): boolean {
		const h = page.hierarchical;
		return h.mandira_hex === '0' && h.gode === 1 && h.patti === 1 && h.pustaka === 1 && h.puta === 1;
	}

	async function loadRandomPage() {
		try {
			loading = true;
			error = '';
			searchLocation = null;
			searchResultPage = null;
			lastSearchedText = '';
			currentPage = await getRandomPage();
			addToHistory(currentPage);
			isAtFirstPage = checkIfFirstPage(currentPage);
		} catch (e) {
			error = 'Failed to load random page. Make sure the backend is running.';
			console.error(e);
		} finally {
			loading = false;
		}
	}

	async function loadPageByAddress() {
		if (!address) {
			error = 'Please enter an address';
			return;
		}

		try {
			loading = true;
			error = '';
			searchLocation = null;
			searchResultPage = null;
			lastSearchedText = '';
			currentPage = await getPageByAddress(address);
			addToHistory(currentPage);
			isAtFirstPage = checkIfFirstPage(currentPage);
		} catch (e) {
			error = 'Failed to load page. Check address and backend status.';
			console.error(e);
		} finally {
			loading = false;
		}
	}

	async function loadNextPage() {
		if (!currentPage || navigating) return;

		try {
			navigating = true;
			error = '';
			currentPage = await getNextPage(currentPage.raw_address);
			addToHistory(currentPage);
			isAtFirstPage = false;
		} catch (e) {
			error = 'Failed to load next page.';
			console.error(e);
		} finally {
			navigating = false;
		}
	}

	async function loadPreviousPage() {
		if (!currentPage || isAtFirstPage || navigating) return;

		try {
			navigating = true;
			error = '';
			const prevPage = await getPreviousPage(currentPage.raw_address);
			if (prevPage) {
				currentPage = prevPage;
				addToHistory(currentPage);
				isAtFirstPage = checkIfFirstPage(currentPage);
			} else {
				isAtFirstPage = true;
			}
		} catch (e) {
			error = 'Failed to load previous page.';
			console.error(e);
		} finally {
			navigating = false;
		}
	}

	async function performSearch() {
		if (!searchQuery.trim()) {
			error = 'Please enter search text';
			return;
		}

		try {
			loading = true;
			error = '';
			currentPage = null;
			searchResultPage = null;
			const normalizedQuery = searchQuery.replace(/\r?\n/g, ' ');
			const response = await searchText(normalizedQuery);

			if (response.found && response.location) {
				searchLocation = response.location;
				lastSearchedText = normalizedQuery;
				isRandomSearch = false;
				searchInfo = `Found location for "${response.query}"`;
				searchResultPage = await getPageByAddress(response.location.raw_address);
			} else {
				searchLocation = null;
				searchInfo = `No exact match found for "${response.query}"`;
			}
		} catch (e) {
			error = 'Search failed. Make sure the backend is running.';
			console.error(e);
		} finally {
			loading = false;
		}
	}

	async function performRandomSearch() {
		if (!searchQuery.trim()) {
			error = 'Please enter search text';
			return;
		}

		try {
			loading = true;
			error = '';
			currentPage = null;
			searchResultPage = null;
			const normalizedQuery = searchQuery.replace(/\r?\n/g, ' ');
			const response = await searchTextRandom(normalizedQuery);

			if (response.found && response.location) {
				searchLocation = response.location;
				lastSearchedText = normalizedQuery;
				isRandomSearch = true;
				searchInfo = `Found "${response.query}" at random position`;
				searchResultPage = await getPageByAddress(response.location.raw_address);
			} else {
				searchLocation = null;
				searchInfo = `Text too long (must be < 410 clusters)`;
			}
		} catch (e) {
			error = 'Random search failed. Make sure the backend is running.';
			console.error(e);
		} finally {
			loading = false;
		}
	}

	async function viewSearchResultAsPage() {
		if (!searchResultPage) return;
		currentPage = searchResultPage;
		addToHistory(currentPage);
		searchLocation = null;
		searchResultPage = null;
		isAtFirstPage = checkIfFirstPage(currentPage);
	}

	function getHighlightedContent(content: string, forSearchResult: boolean = false): string {
		if (!lastSearchedText) return content;

		if (forSearchResult) {
			const highlightClass = isRandomSearch ? 'search-highlight-yellow' : 'search-highlight-blue';
			
			let searchIndex = content.indexOf(lastSearchedText);

			if (searchIndex !== -1) {
				const before = content.substring(0, searchIndex);
				const matchText = content.substring(searchIndex, searchIndex + lastSearchedText.length);
				const after = content.substring(searchIndex + lastSearchedText.length);
				return before + `<mark class="${highlightClass}">${matchText}</mark>` + after;
			}

			const removeSpaces = (str: string) => str.replace(/\s/g, '');
			const searchNoSpaces = removeSpaces(lastSearchedText);
			const contentNoSpaces = removeSpaces(content);
			const noSpaceIndex = contentNoSpaces.indexOf(searchNoSpaces);

			if (noSpaceIndex !== -1) {
				let contentPos = 0;
				let noSpacePos = 0;

				while (noSpacePos < noSpaceIndex && contentPos < content.length) {
					if (!/\s/.test(content[contentPos])) noSpacePos++;
					contentPos++;
				}

				const startPos = contentPos;
				let searchCharsFound = 0;

				while (searchCharsFound < searchNoSpaces.length && contentPos < content.length) {
					if (!/\s/.test(content[contentPos])) searchCharsFound++;
					contentPos++;
				}

				const endPos = contentPos;
				const before = content.substring(0, startPos);
				const matchText = content.substring(startPos, endPos);
				const after = content.substring(endPos);
				return before + `<mark class="${highlightClass}">${matchText}</mark>` + after;
			}
		}

		return content;
	}
</script>

<div class="page">
	<header>
		<h1>ಅಕ್ಷರ ಮಂಟಪ</h1>
		<p class="subtitle">Akshara Mantapa: A Library of Babel for Kannada</p>
		<nav class="main-nav">
			<a href="{base}/about">About</a>
			<span class="nav-separator">•</span>
			<a href="{base}/info">Technical Info</a>
		</nav>
	</header>

	<div class="banner">
		<img src="{base}/main-picture.png" alt="Akshara Mantapa - A Library of Babel for Kannada" />
	</div>

	<article>
		<section class="intro">
			<p>
				An infinite library containing every possible combination of Kannada text.
				Each page is deterministically generated from a unique address. Search for any
				Kannada text and discover its exact location in the library. Inspired by Jorge Luis Borges.
			</p>
		</section>

		<section class="controls">
			<div class="control-row">
				<button on:click={loadRandomPage} disabled={loading}>
					{#if loading && !currentPage}Loading...{:else}Random Page{/if}
				</button>
			</div>

			<details>
				<summary>Navigate by address</summary>
				<div class="control-row">
					<input type="text" bind:value={address} placeholder="Enter hex address or mandira.gode.patti.pustaka.puta..." />
					<button on:click={loadPageByAddress} disabled={loading}>Go to Page</button>
				</div>
			</details>
		</section>

		<section class="history-section">
			<button class="history-toggle" on:click={() => showHistory = !showHistory}>
				{showHistory ? 'Hide' : 'Show'} History ({history.length})
			</button>
			
			{#if showHistory}
				<div class="history-panel">
					{#if history.length === 0}
						<p class="history-empty">No pages visited yet.</p>
					{:else}
						<div class="history-header">
							<span>Recent Pages</span>
							<button class="clear-history" on:click={clearHistory}>Clear All</button>
						</div>
						<ul class="history-list">
							{#each history as item}
								<li>
									<button class="history-item" on:click={() => loadFromHistory(item.address)}>
										<span class="history-preview">{item.preview}...</span>
										<span class="history-time">{formatTimestamp(item.timestamp)}</span>
									</button>
								</li>
							{/each}
						</ul>
					{/if}
				</div>
			{/if}
		</section>

		{#if error}
			<aside class="error">{error}</aside>
		{/if}

		{#if loading && !currentPage}
			<div class="loading">Loading...</div>
		{/if}

		{#if currentPage}
			<section class="page-display" class:is-navigating={navigating}>
				<div class="page-header">
					<h2>
						Page Content
						{#if navigating}
							<span class="loading-indicator">⟳</span>
						{/if}
					</h2>
					<div class="page-navigation">
						<button 
							class="nav-btn" 
							on:click={loadPreviousPage} 
							disabled={navigating || isAtFirstPage}
							title={isAtFirstPage ? "Already at first page" : "Previous page"}
						>
							{#if navigating}⟳{:else}← Prev{/if}
						</button>
						<button 
							class="nav-btn" 
							on:click={loadNextPage} 
							disabled={navigating}
							title="Next page"
						>
							{#if navigating}⟳{:else}Next →{/if}
						</button>
					</div>
				</div>

				{#if copyMessage}
					<aside class="copy-message">{copyMessage}</aside>
				{/if}

				<div class="metadata">
					<strong>Location:</strong>
					{#if currentPage.hierarchical.mandira_kannada}
						<div class="mandira-kannada">
							<div class="mandira-header">
								<strong>ಮಂದಿರ (Room):</strong>
								<button class="copy-btn-inline" on:click={() => copyToClipboard(currentPage?.hierarchical.mandira_kannada || '')}>Copy</button>
							</div>
							<div class="mandira-text">{truncateMandira(currentPage.hierarchical.mandira_kannada)}</div>
						</div>
					{/if}
					<div class="address-components">
						ಗೋಡೆ (Wall) {currentPage.hierarchical.gode} •
						ಪಟ್ಟಿ (Shelf) {currentPage.hierarchical.patti} •
						ಪುಸ್ತಕ (Book) {currentPage.hierarchical.pustaka} •
						ಪುಟ (Page) {currentPage.hierarchical.puta}
					</div>
					<div class="address-copy-buttons">
						<button class="copy-btn" on:click={() => copyToClipboard(currentPage?.raw_address || '')}>Copy Raw Address</button>
						<button class="copy-btn" on:click={() => copyToClipboard(currentPage?.hierarchical.display_string || '')}>Copy Hierarchical Address</button>
					</div>
					<div class="download-buttons">
						<button class="download-btn" on:click={downloadPage} disabled={downloadingBook}>
							Download Page
						</button>
						<button class="download-btn" on:click={downloadBook} disabled={downloadingBook}>
							{#if downloadingBook}
								Downloading... {downloadProgress}%
							{:else}
								Download Book (410 pages)
							{/if}
						</button>
					</div>
				</div>

				<div class="content">
					<pre>{@html getHighlightedContent(currentPage.formatted_content)}</pre>
				</div>

				<div class="page-navigation-bottom">
					<button 
						class="nav-btn" 
						on:click={loadPreviousPage} 
						disabled={navigating || isAtFirstPage}
					>
						{#if navigating}⟳ Loading...{:else}← Previous Page{/if}
					</button>
					<button 
						class="nav-btn" 
						on:click={loadNextPage} 
						disabled={navigating}
					>
						{#if navigating}⟳ Loading...{:else}Next Page →{/if}
					</button>
				</div>
			</section>
		{/if}

		<section class="search-section">
			<h2>Search Kannada Text</h2>
			<div class="control-row">
				<textarea
					class="kannada-search-input"
					class:expanded={searchExpanded || searchQuery.length > 0}
					bind:value={searchQuery}
					placeholder="Search for Kannada text..."
					on:focus={() => searchExpanded = true}
					on:blur={() => { if (!searchQuery) searchExpanded = false }}
					on:keydown={(e) => e.key === 'Enter' && !e.shiftKey && performSearch()}
				></textarea>
				<button on:click={performSearch} disabled={loading}>Search</button>
				<button on:click={performRandomSearch} disabled={loading} title="Find text at a random position within a page">Find Again</button>
			</div>
		</section>

		{#if searchInfo}
			<aside class="search-info-message">{searchInfo}</aside>
		{/if}

		{#if searchLocation}
			<section class="results">
				<h2>Search Result</h2>
				{#if copyMessage}
					<aside class="copy-message">{copyMessage}</aside>
				{/if}
				<div class="result-card">
					<div class="result-info">
						<strong>Found at Location:</strong>
						{#if searchLocation.hierarchical.mandira_kannada}
							<div class="mandira-kannada-small">
								<div class="mandira-header">
									<strong>ಮಂದಿರ:</strong>
									<button class="copy-btn-inline" on:click={() => copyToClipboard(searchLocation?.hierarchical.mandira_kannada || '')}>Copy</button>
								</div>
								<div class="mandira-text">{truncateMandira(searchLocation.hierarchical.mandira_kannada)}</div>
							</div>
						{/if}
						<div class="address-components-search">
							ಗೋಡೆ (Wall) {searchLocation.hierarchical.gode} •
							ಪಟ್ಟಿ (Shelf) {searchLocation.hierarchical.patti} •
							ಪುಸ್ತಕ (Book) {searchLocation.hierarchical.pustaka} •
							ಪುಟ (Page) {searchLocation.hierarchical.puta}
						</div>
						<div class="address-copy-buttons">
							<button class="copy-btn" on:click={() => copyToClipboard(searchLocation?.raw_address || '')}>Copy Raw Address</button>
							<button class="copy-btn" on:click={() => copyToClipboard(searchLocation?.hierarchical.display_string || '')}>Copy Hierarchical Address</button>
							<button class="copy-btn browse-btn" on:click={viewSearchResultAsPage}>Browse from here →</button>
						</div>
					</div>
					{#if searchResultPage}
						<div class="content">
							<pre>{@html getHighlightedContent(searchResultPage.formatted_content, true)}</pre>
						</div>
					{/if}
				</div>
			</section>
		{/if}
	</article>

	<footer>
		<p>
			<a href="https://en.wikipedia.org/wiki/The_Library_of_Babel" target="_blank" rel="noopener">
				Jorge Luis Borges, 1941
			</a>
		</p>
		<div class="made-by">
			<p>Made by <strong>Sanath</strong></p>
			<p class="made-by-links">
				<a href="https://github.com/sanathNU" target="_blank" rel="noopener">GitHub</a>
				<span class="separator">•</span>
				<a href="https://sanathnu.github.io/TechnicaInsania/" target="_blank" rel="noopener">Website</a>
			</p>
		</div>
	</footer>
</div>

<style>
	:global(*) {
		box-sizing: border-box;
	}

	:global(body) {
		margin: 0;
		padding: 0;
		font-family: 'Georgia', 'Palatino Linotype', 'Book Antiqua', 'Palatino', serif;
		font-size: 18px;
		line-height: 1.6;
		color: #000;
		background: #fff;
	}

	.page {
		max-width: 46em;
		margin: 0 auto;
		padding: 3em 2em 2em 2em;
	}

	header {
		margin-bottom: 2em;
		border-bottom: 1px solid #ccc;
		padding-bottom: 1em;
	}

	h1 {
		font-size: 2em;
		font-weight: normal;
		margin: 0 0 0.25em 0;
		line-height: 1.2;
	}

	.subtitle {
		font-size: 1.1em;
		margin: 0 0 0.75em 0;
		color: #666;
		font-style: italic;
	}

	.main-nav {
		font-size: 0.9em;
		margin-top: 0.75em;
	}

	.main-nav a {
		color: #333;
		text-decoration: none;
		border-bottom: 1px solid #ccc;
		padding: 0.2em 0;
	}

	.main-nav a:hover {
		color: #000;
		border-bottom-color: #000;
	}

	.nav-separator {
		margin: 0 0.75em;
		color: #ccc;
	}

	.banner {
		margin: 1.5em 0 2em 0;
		text-align: center;
	}

	.banner img {
		max-width: 100%;
		height: auto;
		border: 1px solid #ddd;
		border-radius: 12px;
	}

	article {
		margin-bottom: 2em;
	}

	section {
		margin: 2em 0;
	}

	.intro p {
		margin: 0 0 1em 0;
		text-align: justify;
	}

	h2 {
		font-size: 1.3em;
		font-weight: normal;
		margin: 0;
	}

	.controls {
		background: #fafafa;
		border: 1px solid #ddd;
		padding: 1.5em;
		margin: 2em 0;
	}

	.search-section {
		background: #fafafa;
		border: 1px solid #ddd;
		padding: 1.5em;
		margin: 2em 0;
	}

	.search-section h2 {
		margin-bottom: 1em;
	}

	.control-row {
		display: flex;
		gap: 0.5em;
		margin-bottom: 1em;
		align-items: flex-start;
	}

	.control-row:last-child {
		margin-bottom: 0;
	}

	input[type="text"] {
		font-family: inherit;
		font-size: 0.9em;
		padding: 0.4em 0.6em;
		border: 1px solid #ccc;
		background: #fff;
		flex: 1;
	}

	textarea.kannada-search-input {
		font-family: 'Noto Sans Kannada', inherit;
		font-size: 0.9em;
		padding: 0.4em 0.6em;
		border: 1px solid #ccc;
		background: #fff;
		flex: 1;
		height: 2.5em;
		min-height: 2.5em;
		resize: vertical;
		line-height: 1.6;
		transition: height 0.25s ease;
	}

	textarea.kannada-search-input:focus,
	textarea.kannada-search-input.expanded {
		height: 200px;
	}

	input:focus,
	textarea:focus {
		outline: 2px solid #000;
		outline-offset: 0;
	}

	button {
		font-family: inherit;
		font-size: 0.9em;
		padding: 0.4em 1em;
		border: 1px solid #000;
		background: #fff;
		color: #000;
		cursor: pointer;
		transition: background 0.15s ease, color 0.15s ease;
	}

	button:hover:not(:disabled) {
		background: #000;
		color: #fff;
	}

	button:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	details {
		margin-top: 1em;
		border-top: 1px solid #eee;
		padding-top: 1em;
	}

	summary {
		cursor: pointer;
		font-size: 0.95em;
		color: #666;
		margin-bottom: 1em;
	}

	summary:hover {
		color: #000;
	}

	/* History styles */
	.history-section {
		margin: 1em 0;
	}

	.history-toggle {
		font-size: 0.85em;
		padding: 0.4em 0.8em;
		background: #f5f5f5;
		border: 1px solid #ccc;
	}

	.history-panel {
		background: #fafafa;
		border: 1px solid #ddd;
		padding: 1em;
		margin-top: 0.5em;
		max-height: 300px;
		overflow-y: auto;
	}

	.history-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 0.75em;
		padding-bottom: 0.5em;
		border-bottom: 1px solid #eee;
	}

	.clear-history {
		font-size: 0.75em;
		padding: 0.2em 0.5em;
		color: #666;
		border-color: #ccc;
	}

	.history-list {
		list-style: none;
		padding: 0;
		margin: 0;
	}

	.history-item {
		width: 100%;
		text-align: left;
		padding: 0.5em;
		margin: 0.25em 0;
		background: #fff;
		border: 1px solid #eee;
		cursor: pointer;
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.history-item:hover {
		background: #f0f0f0;
		border-color: #ccc;
	}

	.history-preview {
		font-family: 'Noto Sans Kannada', serif;
		font-size: 0.9em;
		color: #333;
		flex: 1;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.history-time {
		font-size: 0.75em;
		color: #999;
		margin-left: 1em;
	}

	.history-empty {
		color: #666;
		font-style: italic;
		margin: 0;
	}

	.error {
		background: #ffe;
		border-left: 3px solid #cc0;
		padding: 1em;
		margin: 1em 0;
		font-size: 0.95em;
	}

	.search-info-message {
		background: #e8f4f8;
		border-left: 3px solid #4a90e2;
		padding: 1em;
		margin: 1em 0;
		font-size: 0.95em;
		color: #333;
	}

	.copy-message {
		background: #efe;
		border-left: 3px solid #6c6;
		padding: 0.5em 1em;
		margin: 0.5em 0;
		font-size: 0.9em;
		color: #060;
	}

	.loading {
		text-align: center;
		color: #666;
		font-style: italic;
		margin: 2em 0;
	}

	.page-display {
		margin: 2em 0;
		transition: opacity 0.2s ease;
	}

	.page-display.is-navigating {
		opacity: 0.6;
		pointer-events: none;
	}

	.page-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1em;
		padding-bottom: 0.5em;
		border-bottom: 1px solid #eee;
	}

	.loading-indicator {
		display: inline-block;
		animation: spin 1s linear infinite;
		margin-left: 0.5em;
		font-size: 0.9em;
	}

	@keyframes spin {
		from { transform: rotate(0deg); }
		to { transform: rotate(360deg); }
	}

	.page-navigation {
		display: flex;
		gap: 0.5em;
	}

	.nav-btn {
		font-size: 0.85em;
		padding: 0.4em 0.8em;
		min-width: 5em;
	}

	.page-navigation-bottom {
		display: flex;
		justify-content: space-between;
		margin-top: 1.5em;
		padding-top: 1em;
		border-top: 1px solid #eee;
	}

	.metadata {
		font-size: 0.9em;
		color: #666;
		margin-bottom: 1em;
		font-family: 'Courier New', 'Courier', monospace;
	}

	.mandira-kannada {
		font-family: 'Noto Sans Kannada', serif;
		background: #f8fafc;
		padding: 0.75em;
		margin: 0.5em 0;
		border-left: 3px solid #2563eb;
		color: #1d4ed8;
		font-size: 1.05em;
		line-height: 1.6;
	}

	.mandira-kannada-small {
		font-family: 'Noto Sans Kannada', serif;
		background: #f8fafc;
		padding: 0.5em;
		margin: 0.5em 0;
		border-left: 3px solid #2563eb;
		color: #1d4ed8;
		font-size: 0.95em;
		line-height: 1.6;
	}

	.mandira-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 0.5em;
	}

	.mandira-text {
		word-wrap: break-word;
		overflow-wrap: break-word;
	}

	.address-components {
		font-family: 'Noto Sans Kannada', serif;
		font-size: 1em;
		color: #000;
		margin: 0.75em 0;
		padding: 0.5em;
		background: #f9f9f9;
		border-left: 3px solid #666;
	}

	.address-components-search {
		font-family: 'Noto Sans Kannada', serif;
		font-size: 0.95em;
		color: #000;
		margin: 0.5em 0;
		padding: 0.5em;
		background: #f9f9f9;
		border-left: 3px solid #666;
	}

	.address-copy-buttons {
		display: flex;
		gap: 0.5em;
		margin-top: 1em;
		flex-wrap: wrap;
	}

	.copy-btn {
		font-size: 0.75em;
		padding: 0.3em 0.6em;
		border: 1px solid #666;
		background: #f5f5f5;
		color: #333;
	}

	.copy-btn:hover {
		background: #333;
		color: #fff;
		border-color: #333;
	}

	.copy-btn-inline {
		font-size: 0.85em;
		padding: 0.2em 0.5em;
		border: 1px solid #666;
		background: #fff;
		color: #333;
	}

	.copy-btn-inline:hover {
		background: #333;
		color: #fff;
		border-color: #333;
	}

	.browse-btn {
		background: #000;
		color: #fff;
		border-color: #000;
	}

	.browse-btn:hover {
		background: #333;
	}

	/* Download buttons */
	.download-buttons {
		display: flex;
		gap: 0.5em;
		margin-top: 0.5em;
	}

	.download-btn {
		font-size: 0.75em;
		padding: 0.3em 0.6em;
		border: 1px solid #166534;
		background: #f0fdf4;
		color: #166534;
	}

	.download-btn:hover:not(:disabled) {
		background: #166534;
		color: #fff;
	}

	.download-btn:disabled {
		opacity: 0.6;
		cursor: wait;
	}

	.content {
		background: #fafafa;
		border: 1px solid #ddd;
		padding: 1.5em;
		margin: 1em 0;
		overflow-x: auto;
	}

	.content pre {
		font-family: 'Noto Sans Kannada', 'Tunga', serif;
		font-size: 0.95em;
		line-height: 1.8;
		white-space: pre;
		margin: 0;
		min-width: max-content;
	}

	:global(.search-highlight-yellow) {
		background: #fff59d;
		color: #000;
		padding: 0.1em 0.2em;
	}

	:global(.search-highlight-blue) {
		background: #bbdefb;
		color: #000;
		padding: 0.1em 0.2em;
	}

	.results {
		margin: 2em 0;
	}

	.result-card {
		background: #fafafa;
		border: 1px solid #ddd;
		padding: 1.5em;
		margin-top: 1em;
	}

	.result-info {
		font-family: 'Courier New', 'Courier', monospace;
		font-size: 0.9em;
		margin-bottom: 1em;
		line-height: 1.8;
		word-break: break-all;
		overflow-wrap: break-word;
	}

	footer {
		border-top: 1px solid #ccc;
		padding-top: 1.5em;
		margin-top: 3em;
		font-size: 0.9em;
		color: #666;
		text-align: center;
	}

	.made-by {
		margin-top: 1em;
	}

	.made-by p {
		margin: 0.25em 0;
	}

	.made-by strong {
		color: #333;
	}

	.made-by-links a {
		color: #1d4ed8;
		text-decoration: none;
		border-bottom: 1px solid #93c5fd;
	}

	.made-by-links a:hover {
		border-bottom-color: #1d4ed8;
	}

	.separator {
		margin: 0 0.75em;
		color: #ccc;
	}

	footer > p a {
		color: #666;
		text-decoration: none;
		border-bottom: 1px dotted #999;
	}

	footer > p a:hover {
		border-bottom-style: solid;
		color: #000;
	}

	@media (max-width: 768px) {
		.page {
			padding: 2em 1em;
		}

		h1 {
			font-size: 1.5em;
		}

		.page-header {
			flex-direction: column;
			align-items: flex-start;
			gap: 0.75em;
		}

		.page-navigation-bottom {
			flex-direction: column;
			gap: 0.5em;
		}

		.page-navigation-bottom button {
			width: 100%;
		}

		.download-buttons {
			flex-direction: column;
		}

		.download-btn {
			width: 100%;
		}
	}
</style>