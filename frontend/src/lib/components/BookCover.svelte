<script lang="ts">
	// The open book's cover: its room number punched on tape, its binding from the book number's low bits.
	// Every page of a book shows the same cover; the drawing lives in $lib/cover.
	import type { ScriptCode } from '$lib/api';
	import { bookOf, coverSvg } from '$lib/cover';

	interface Props {
		rawAddress: string;
		script: ScriptCode;
	}

	let { rawAddress, script }: Props = $props();

	const book = $derived(bookOf(rawAddress, script));
	// Built only from numbers and the script's own labels, all escaped in coverSvg.
	const svg = $derived(book ? coverSvg(book, script) : '');
</script>

{#if svg}
	<div class="cover">{@html svg}</div>
{/if}

<style>
	.cover {
		width: 172px;
		margin: 0 0 26px;
	}

	.cover :global(svg) {
		display: block;
		width: 100%;
		height: auto;
	}
</style>
