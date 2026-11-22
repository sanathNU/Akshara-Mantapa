<script lang="ts">
	// A small spiral stair for a history entry, the same for every page of a book, in that book's binding.
	import type { ScriptCode } from '$lib/api';
	import { bookOf, stairSvg } from '$lib/cover';

	interface Props {
		rawAddress: string;
		script: ScriptCode;
		/** Width and height in pixels. */
		size?: number;
	}

	let { rawAddress, script, size = 30 }: Props = $props();

	const book = $derived(bookOf(rawAddress, script));
	// Built only from numbers, in stairSvg.
	const svg = $derived(book ? stairSvg(book) : '');
</script>

<span class="stair" style:width="{size}px" style:height="{size}px">{@html svg}</span>

<style>
	.stair {
		display: block;
		align-self: center;
	}

	.stair :global(svg) {
		display: block;
		width: 100%;
		height: 100%;
	}
</style>
