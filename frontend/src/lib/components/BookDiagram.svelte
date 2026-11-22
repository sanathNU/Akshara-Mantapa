<script lang="ts">
	// A book's cover or stair drawn large for the Info page, with numbered markers on the drawing and a key
	// beside it saying what each one shows. [another book] asks the page for a new example.
	import type { ScriptCode } from '$lib/api';
	import { bookOf, coverMarks, coverSvg, palette, stairFacts, stairMarks, stairSvg } from '$lib/cover';

	interface Props {
		rawAddress: string;
		script: ScriptCode;
		kind: 'cover' | 'stair';
		/** What each numbered marker shows, in order. */
		key: string[];
		onanother: () => void;
	}

	let { rawAddress, script, kind, key, onanother }: Props = $props();

	const book = $derived(bookOf(rawAddress, script));
	const colours = $derived(book ? palette(book.binding) : null);
	// Built only from numbers and the script's own labels, all escaped in $lib/cover.
	const svg = $derived(book ? (kind === 'cover' ? coverSvg(book, script) : stairSvg(book)) : '');
	const marks = $derived(book ? (kind === 'cover' ? coverMarks(book) : stairMarks(book)) : []);
	// Markers share the drawing's frame: the cover with its page edges, or the stair's 100 x 100.
	const frame = $derived(
		kind === 'cover'
			? { view: '0 0 412 612', r: 21, size: 27, dy: 9, ring: 3 }
			: { view: '0 0 100 100', r: 5.2, size: 7, dy: 2.4, ring: 0.8 }
	);
	const facts = $derived.by(() => {
		if (!book) return '';
		if (kind === 'cover') return `wall ${book.wall}, shelf ${book.shelf}, book ${book.slot}`;
		const s = stairFacts(book);
		return `${s.stepsPerTurn} steps a turn, ${s.turns.toFixed(1)} turns in sight, winding ${s.clockwise ? 'clockwise' : 'anticlockwise'}`;
	});
</script>

{#if book && colours}
	<figure class="diagram">
		<div class="art">
			{@html svg}
			<svg class="marks" viewBox={frame.view} aria-hidden="true">
				{#each marks as [x, y], i}
					<circle cx={x} cy={y} r={frame.r} fill={colours.ink} stroke={colours.ground} stroke-width={frame.ring} />
					<text {x} y={y + frame.dy} text-anchor="middle" font-size={frame.size} fill={colours.ground}>{i + 1}</text>
				{/each}
			</svg>
		</div>
		<figcaption>
			<ol class="key">
				{#each key as item}<li>{item}</li>{/each}
			</ol>
			<p class="cmd">
				<button class="br" type="button" onclick={onanother}>another book</button>
				<span>{facts}</span>
			</p>
		</figcaption>
	</figure>
{/if}

<style>
	.diagram {
		display: grid;
		grid-template-columns: 220px minmax(0, 1fr);
		gap: 28px;
		align-items: start;
		margin: 8px 0 26px;
	}

	.art {
		position: relative;
	}

	.art :global(svg) {
		display: block;
		width: 100%;
		height: auto;
	}

	.marks {
		position: absolute;
		inset: 0;
		pointer-events: none;
	}

	.marks text {
		font-family: var(--serif);
		font-weight: 600;
		font-variant-numeric: lining-nums;
	}

	.key {
		margin: 0;
		padding: 0;
		list-style: none;
		counter-reset: key;
		display: grid;
		gap: 10px;
		font-size: 18px;
		line-height: 1.45;
	}

	.key li {
		margin: 0;
		display: grid;
		grid-template-columns: 26px minmax(0, 1fr);
		gap: 10px;
		align-items: baseline;
	}

	.key li::before {
		counter-increment: key;
		content: counter(key);
		display: inline-grid;
		place-items: center;
		width: 22px;
		height: 22px;
		border-radius: 50%;
		background: var(--ink);
		color: var(--bg);
		font-size: 14px;
		font-variant-numeric: lining-nums;
		transform: translateY(-1px);
	}

	.cmd {
		margin: 14px 0 0;
		display: flex;
		flex-wrap: wrap;
		gap: 4px 14px;
		align-items: baseline;
		font-size: 17px;
		text-align: left;
	}

	.cmd span {
		color: var(--muted);
	}

	@media (max-width: 720px) {
		.diagram {
			grid-template-columns: minmax(0, 1fr);
		}

		.art {
			max-width: 240px;
		}
	}
</style>
