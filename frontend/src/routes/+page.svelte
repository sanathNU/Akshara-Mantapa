<script lang="ts">
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
	let error = '';
	let address = '';
	let copyMessage = '';
	let lastSearchedText = '';
	let isRandomSearch = false;
	let searchExpanded = false;
	let isAtFirstPage = false;

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
			isAtFirstPage = checkIfFirstPage(currentPage);
		} catch (e) {
			error = 'Failed to load page. Check address and backend status.';
			console.error(e);
		} finally {
			loading = false;
		}
	}

	async function loadNextPage() {
		if (!currentPage) return;

		try {
			loading = true;
			error = '';
			currentPage = await getNextPage(currentPage.raw_address);
			isAtFirstPage = false;
		} catch (e) {
			error = 'Failed to load next page.';
			console.error(e);
		} finally {
			loading = false;
		}
	}

	async function loadPreviousPage() {
		if (!currentPage || isAtFirstPage) return;

		try {
			loading = true;
			error = '';
			const prevPage = await getPreviousPage(currentPage.raw_address);
			if (prevPage) {
				currentPage = prevPage;
				isAtFirstPage = checkIfFirstPage(currentPage);
			} else {
				isAtFirstPage = true;
			}
		} catch (e) {
			error = 'Failed to load previous page.';
			console.error(e);
		} finally {
			loading = false;
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
		searchLocation = null;
		searchResultPage = null;
		isAtFirstPage = checkIfFirstPage(currentPage);
	}

	function getHighlightedContent(content: string, forSearchResult: boolean = false): string {
		if (!lastSearchedText) return content;

		if (forSearchResult) {
			if (isRandomSearch) {
				let searchIndex = content.indexOf(lastSearchedText);

				if (searchIndex === -1) {
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
						return before + `<mark class="search-highlight-yellow">${matchText}</mark>` + after;
					}
				} else {
					const before = content.substring(0, searchIndex);
					const matchText = content.substring(searchIndex, searchIndex + lastSearchedText.length);
					const after = content.substring(searchIndex + lastSearchedText.length);
					return before + `<mark class="search-highlight-yellow">${matchText}</mark>` + after;
				}
			} else {
				const mandiraLength = 410;
				const mandiraEnd = Math.min(mandiraLength, content.length);
				const mandiraContent = content.substring(0, mandiraEnd);
				const rest = content.substring(mandiraEnd);
				return `<mark class="search-highlight-blue">${mandiraContent}</mark>` + rest;
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
			<a href="/about">About</a>
			<span class="nav-separator">•</span>
			<a href="/info">Technical Info</a>
		</nav>
	</header>

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
				<button on:click={loadRandomPage} disabled={loading}>Random Page</button>
			</div>

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
				<button on:click={performRandomSearch} disabled={loading} title="Find text at random position within a page">Random Position</button>
			</div>

			<details>
				<summary>Navigate by address</summary>
				<div class="control-row">
					<input type="text" bind:value={address} placeholder="Enter hex address or mandira.gode.patti.pustaka.puta..." />
					<button on:click={loadPageByAddress} disabled={loading}>Go to Page</button>
				</div>
			</details>
		</section>

		{#if error}
			<aside class="error">{error}</aside>
		{/if}

		{#if loading}
			<div class="loading">Loading...</div>
		{/if}

		{#if currentPage}
			<section class="page-display">
				<div class="page-header">
					<h2>Page Content</h2>
					<div class="page-navigation">
						<button 
							class="nav-btn" 
							on:click={loadPreviousPage} 
							disabled={loading || isAtFirstPage}
							title={isAtFirstPage ? "Already at first page" : "Previous page"}
						>
							← Prev
						</button>
						<button 
							class="nav-btn" 
							on:click={loadNextPage} 
							disabled={loading}
							title="Next page"
						>
							Next →
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
				</div>

				<div class="content">
					<pre>{@html getHighlightedContent(currentPage.formatted_content)}</pre>
				</div>

				<div class="page-navigation-bottom">
					<button 
						class="nav-btn" 
						on:click={loadPreviousPage} 
						disabled={loading || isAtFirstPage}
					>
						← Previous Page
					</button>
					<button 
						class="nav-btn" 
						on:click={loadNextPage} 
						disabled={loading}
					>
						Next Page →
					</button>
				</div>
			</section>
		{/if}

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
	}

	.page-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1em;
		padding-bottom: 0.5em;
		border-bottom: 1px solid #eee;
	}

	.page-navigation {
		display: flex;
		gap: 0.5em;
	}

	.nav-btn {
		font-size: 0.85em;
		padding: 0.4em 0.8em;
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
		background: #fafafa;
		padding: 0.75em;
		margin: 0.5em 0;
		border-left: 3px solid #c30;
		color: #c30;
		font-size: 1.05em;
		line-height: 1.6;
	}

	.mandira-kannada-small {
		font-family: 'Noto Sans Kannada', serif;
		background: #fafafa;
		padding: 0.5em;
		margin: 0.5em 0;
		border-left: 3px solid #c30;
		color: #c30;
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

	.content {
		background: #fafafa;
		border: 1px solid #ddd;
		padding: 1.5em;
		margin: 1em 0;
	}

	.content pre {
		font-family: 'Noto Sans Kannada', 'Tunga', serif;
		font-size: 0.95em;
		line-height: 1.8;
		white-space: pre-wrap;
		word-wrap: break-word;
		margin: 0;
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
		padding-top: 1em;
		margin-top: 3em;
		font-size: 0.9em;
		color: #666;
	}

	footer p {
		margin: 0;
	}

	footer a {
		color: inherit;
		text-decoration: none;
		border-bottom: 1px dotted #999;
	}

	footer a:hover {
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
	}
</style>