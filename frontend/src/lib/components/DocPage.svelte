<script lang="ts">
	// Shared frame for the About, Info and Ideas pages: the front page's type and colours,
	// set as a single reading column with a small-caps label over a bold title.
	import type { Snippet } from 'svelte';
	import { base } from '$app/paths';
	import ThemeToggle from './ThemeToggle.svelte';

	interface Props {
		label: string;
		labelLang?: string;
		title: string;
		titleLang?: string;
		subtitle?: string;
		backText?: string;
		madeByText?: string;
		websiteText?: string;
		/** Language of the label and footer strings when they are not English. */
		uiLang?: string;
		controls?: Snippet;
		children: Snippet;
	}

	let {
		label,
		labelLang,
		title,
		titleLang,
		subtitle,
		backText = 'Back to the library',
		madeByText = 'Made by',
		websiteText = 'Website',
		uiLang,
		controls,
		children
	}: Props = $props();
</script>

<div class="doc">
	<div class="top">
		<a class="home" href="{base}/">
			<img class="arch" src="{base}/main-picture.jpg" alt="" />
			<span lang="kn">ಅಕ್ಷರ ಮಂಟಪ</span>
			<span class="sc">Akshara Mantapa</span>
		</a>
		<div class="tools">
			{@render controls?.()}
			<ThemeToggle />
		</div>
	</div>

	<header>
		<p class="label sc" lang={labelLang}>{label}</p>
		<h1 lang={titleLang}>{title}</h1>
		{#if subtitle}<p class="subtitle">{subtitle}</p>{/if}
	</header>

	<main>
		{@render children()}
	</main>

	<footer>
		<a class="br" href="{base}/" lang={uiLang}>← {backText}</a>
		<span class="sc">
			<span lang={uiLang}>{madeByText}</span> Sanath<span class="sep" aria-hidden="true">·</span><a
				href="https://github.com/sanathNU"
				target="_blank"
				rel="noopener">GitHub</a
			><span class="sep" aria-hidden="true">·</span><a href="https://sanathnu.github.io/TechnicaInsania/" target="_blank" rel="noopener"
				><span lang={uiLang}>{websiteText}</span></a
			>
		</span>
	</footer>
</div>

<style>
	.doc {
		max-width: 840px;
		margin: 0 auto;
		padding: 0 40px;
	}

	.top {
		display: flex;
		justify-content: space-between;
		align-items: center;
		flex-wrap: wrap;
		gap: 10px 24px;
		padding: 24px 0 14px;
		border-bottom: 1px solid var(--rule);
		font-size: 18px;
	}

	.home {
		display: flex;
		align-items: center;
		gap: 10px;
		text-decoration: none;
	}

	.home [lang] {
		font-size: 19px;
		font-weight: 500;
	}

	.home .sc {
		color: var(--ink-soft);
	}

	.home:hover .sc {
		color: var(--warm);
	}

	.arch {
		width: 24px;
		height: 32px;
		border: 1px solid var(--frame);
		border-radius: 12px 12px 0 0 / 11px 11px 0 0;
		object-fit: cover;
		object-position: 34% 50%;
	}

	.tools {
		display: flex;
		align-items: center;
		gap: 18px;
	}

	header {
		margin: 56px 0 8px;
	}

	.label {
		margin: 0 0 6px;
		font-size: 17px;
		color: var(--muted);
	}

	h1 {
		margin: 0;
		font-size: 42px;
		font-weight: 600;
		line-height: 1.15;
		letter-spacing: -0.005em;
	}

	h1[lang] {
		font-size: 36px;
		font-weight: 500;
		line-height: 1.4;
	}

	.subtitle {
		margin: 10px 0 0;
		font-size: 20px;
		color: var(--ink-soft);
	}

	footer {
		display: flex;
		justify-content: space-between;
		flex-wrap: wrap;
		gap: 8px 20px;
		margin-top: 72px;
		padding: 16px 0 36px;
		border-top: 1px solid var(--rule);
		font-size: 18px;
		color: var(--muted);
	}

	/* Reading styles for the page content. Kannada paragraphs stay ragged-right: justified
	   Kannada opens wide gaps between words. */
	main :global(section) {
		margin-top: 44px;
	}

	main :global(h2) {
		margin: 0 0 12px;
		font-size: 28px;
		font-weight: 600;
		line-height: 1.25;
	}

	main :global(h3) {
		margin: 30px 0 8px;
		font-size: 22px;
		font-weight: 600;
		line-height: 1.3;
	}

	main :global(h4) {
		margin: 0 0 6px;
		font-size: 17px;
		font-weight: 400;
		font-variant-caps: all-small-caps;
		letter-spacing: 0.1em;
		color: var(--muted);
	}

	main :global(p) {
		margin: 0 0 16px;
	}

	main :global(:where(p:lang(en))) {
		text-align: justify;
		hyphens: auto;
	}

	/* Noto Sans Kannada reads about a size larger than EB Garamond at the same setting. */
	main :global(article:lang(kn)) {
		font-size: 18px;
		line-height: 1.85;
	}

	main :global(:where(p, li, h3, blockquote) > [lang|='kn']) {
		font-size: 0.9em;
	}

	main :global(ul),
	main :global(ol) {
		margin: 0 0 16px;
		padding-left: 1.3em;
	}

	main :global(li) {
		margin: 6px 0;
	}

	main :global(li::marker) {
		color: var(--muted);
	}

	main :global(strong) {
		font-weight: 600;
	}

	main :global(blockquote) {
		margin: 20px 0;
		padding: 2px 0 2px 20px;
		border-left: 1px solid var(--rule-strong);
		color: var(--ink-soft);
	}

	main :global(blockquote footer) {
		margin-top: 8px;
		font-size: 17px;
		color: var(--muted);
	}

	main :global(.basavanna-quote) {
		font-size: 1.15em;
		color: var(--ink);
	}

	main :global(.translation) {
		font-size: 0.8em;
		color: var(--muted);
	}

	/* Notes sit on the same warm paper as the library page. */
	main :global(.origin-note),
	main :global(.note),
	main :global(.notice),
	main :global(.address-type) {
		margin: 18px 0;
		padding: 12px 18px;
		border: 1px solid var(--paper-line);
		background: var(--paper);
		font-size: 0.9em;
		text-align: left;
	}

	main :global(.notice p),
	main :global(.address-type p:last-child) {
		margin-bottom: 0;
	}

	main :global(pre),
	main :global(code),
	main :global(.code-block) {
		font-family: var(--mono);
		font-variant-numeric: normal;
	}

	main :global(pre) {
		margin: 12px 0 18px;
		padding: 12px 16px;
		overflow-x: auto;
		border: 1px solid var(--paper-line);
		background: var(--paper);
		font-size: 14px;
		line-height: 1.6;
	}

	main :global(.address-type pre) {
		background: var(--bg);
	}

	main :global(code) {
		font-size: 0.78em;
		overflow-wrap: anywhere;
	}

	main :global(.address-example) {
		display: block;
		margin: 2px 0 8px;
	}

	main :global(.code-block) {
		display: block;
		width: fit-content;
		max-width: 100%;
		margin: 6px 0 2px;
		padding: 3px 10px;
		border: 1px solid var(--paper-line);
		background: var(--paper);
		font-size: 14px;
		line-height: 1.6;
		overflow-wrap: anywhere;
	}

	main :global(.examples) {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
		gap: 10px;
		margin: 16px 0 20px;
	}

	main :global(.example-card) {
		padding: 10px 14px 12px;
		border: 1px solid var(--paper-line);
		background: var(--paper);
	}

	main :global(.cluster-display) {
		font-size: 34px;
		line-height: 1.4;
	}

	main :global(.cluster-desc) {
		font-size: 15px;
		line-height: 1.35;
		color: var(--ink-soft);
	}

	main :global(.kannada-large) {
		font-size: 1.25em;
	}

	main :global(.table-wrap) {
		overflow-x: auto;
		margin: 12px 0 18px;
	}

	main :global(table) {
		width: 100%;
		border-collapse: collapse;
		font-size: 17px;
	}

	main :global(th) {
		padding: 6px 12px 6px 0;
		border-bottom: 1px solid var(--rule-strong);
		font-weight: 400;
		font-variant-caps: all-small-caps;
		letter-spacing: 0.08em;
		text-align: left;
		color: var(--muted);
	}

	main :global(td) {
		padding: 7px 12px 7px 0;
		border-bottom: 1px solid var(--rule);
		vertical-align: top;
	}

	main :global(td:first-child) {
		color: var(--ink-soft);
	}

	@media (max-width: 720px) {
		.doc {
			padding: 0 18px;
		}

		.home .sc {
			display: none;
		}

		header {
			margin-top: 36px;
		}

		h1 {
			font-size: 34px;
		}

		h1[lang] {
			font-size: 30px;
		}

		main :global(h2) {
			font-size: 25px;
		}

		main :global(:where(p:lang(en))) {
			text-align: left;
		}
	}
</style>
