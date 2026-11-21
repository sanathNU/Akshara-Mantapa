<script lang="ts">
	// A small spiral stair for a history entry, the same for every page of a book, in that book's binding.
	import type { ScriptCode } from '$lib/api';
	import { bookOf, stairSvg } from '$lib/cover';

	interface Props {
		rawAddress: string;
		script: ScriptCode;
	}

	let { rawAddress, script }: Props = $props();

	const book = $derived(bookOf(rawAddress, script));
	// Built only from numbers, in stairSvg.
	const svg = $derived(book ? stairSvg(book) : '');
</script>

<span class="stair">{@html svg}</span>

<style>
	.stair {
		display: block;
		width: 30px;
		height: 30px;
		align-self: center;
	}

	.stair :global(svg) {
		display: block;
		width: 100%;
		height: 100%;
	}
</style>
