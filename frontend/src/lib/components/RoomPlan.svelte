<script lang="ts">
	// Map of where the open page sits: the hexagonal room with its current wall filled in,
	// and that wall's shelves with the current book in terracotta.
	import { BOOKS_PER_SHELF, SHELVES_PER_WALL, WALLS_PER_ROOM } from '$lib/library';
	import { BOOK, GRID_LEFT, GRID_SPAN, PLAN, bookcases, floor, passages, shaft, shelfRows } from '$lib/room-plan';

	interface Props {
		wall: number;
		shelf: number;
		book: number;
	}

	let { wall, shelf, book }: Props = $props();

	const cases = $derived(bookcases(wall));
	const rows = $derived(shelfRows(shelf, book));
	const label = $derived(
		`Room plan: wall ${wall} of ${WALLS_PER_ROOM}, shelf ${shelf} of ${SHELVES_PER_WALL}, book ${book} of ${BOOKS_PER_SHELF}`
	);
	const doorways = passages();
</script>

<svg class="plan" viewBox="0 0 {PLAN.width} {PLAN.height}" role="img" aria-label={label}>
	<polygon class="floor" points={floor} />
	{#each cases as bookcase (bookcase.wall)}
		<polygon class="case" class:on={bookcase.current} points={bookcase.points} />
		<text class:on={bookcase.current} x={bookcase.label.x.toFixed(1)} y={bookcase.label.y.toFixed(1)}
			>{bookcase.wall}</text
		>
	{/each}
	{#each doorways as d}
		<path class="line" {d} />
	{/each}
	<polygon class="shaft" points={shaft} />
	{#each rows as row (row.shelf)}
		{#if row.current}
			<rect class="row-on" x={GRID_LEFT - 3} y={row.y - 2} width={GRID_SPAN + 6} height={BOOK.height + 4} />
		{/if}
		{#each row.books as spine}
			<rect
				class="book"
				class:cur={row.current}
				class:on={spine.current}
				x={spine.x.toFixed(1)}
				y={row.y}
				width={BOOK.width}
				height={BOOK.height}
			/>
		{/each}
		<path class="line" d="M{GRID_LEFT - 4},{row.y + BOOK.height + 2.5}H{GRID_LEFT + GRID_SPAN + 4}" />
		<text class:on={row.current} x={GRID_LEFT - 10} y={row.y + 10}>{row.shelf}</text>
	{/each}
</svg>

<style>
	.plan {
		display: block;
		width: 240px;
		max-width: 100%;
		height: auto;
	}

	.floor {
		fill: var(--floor);
	}

	.case {
		fill: var(--bg);
		stroke: var(--ink);
		stroke-width: 1;
	}

	.case.on,
	.row-on {
		fill: var(--wall);
	}

	.line {
		fill: none;
		stroke: var(--ink);
		stroke-width: 1;
	}

	.shaft {
		fill: var(--shaft);
		stroke: var(--ink);
		stroke-width: 0.8;
		stroke-dasharray: 2 2;
	}

	.book {
		fill: none;
		stroke: var(--muted);
		stroke-width: 0.6;
	}

	.book.cur {
		stroke: var(--ink);
	}

	.book.on {
		fill: var(--book);
		stroke: var(--book);
	}

	text {
		font-family: var(--serif);
		font-size: 12px;
		fill: var(--muted);
		text-anchor: middle;
	}

	text.on {
		fill: var(--ink);
		font-weight: 600;
	}
</style>
