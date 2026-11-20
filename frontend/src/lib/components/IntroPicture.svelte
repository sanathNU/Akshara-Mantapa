<script lang="ts">
	// The banner picture, shown full screen on a first visit. After a few seconds, or as soon
	// as the visitor clicks, types or scrolls, it shrinks into the arch-shaped icon beside the
	// title (the arch echoes the lit doorway in the picture). Clicking the icon brings it back.
	import { onMount, tick } from 'svelte';

	interface Props {
		src: string;
		alt: string;
		heading: string;
		subtitle: string;
		lang: string;
	}

	let { src, alt, heading, subtitle, lang }: Props = $props();

	const SEEN_KEY = 'akshara.pictureSeen';
	const SHOW_FOR_MS = 3500;
	/** Where the lit doorway sits, as a fraction of the picture's width. */
	const DOORWAY_X = 0.385;
	const EASE = 'cubic-bezier(.6, 0, .2, 1)';
	const FULL: Keyframe = {
		clipPath: 'inset(0px 0px 0px 0px round 0px 0px 0px 0px / 0px 0px 0px 0px)',
		transform: 'translate(0px, 0px) scale(1)'
	};

	let open = $state(!seenBefore());
	let animating = false;
	let timer: ReturnType<typeof setTimeout> | undefined;
	let picture: HTMLImageElement | undefined = $state();
	let caption: HTMLElement | undefined = $state();
	let backdrop: HTMLElement | undefined = $state();
	let iconImage: HTMLImageElement | undefined = $state();

	function seenBefore(): boolean {
		try {
			return localStorage.getItem(SEEN_KEY) === '1';
		} catch {
			return true;
		}
	}

	function rememberSeen() {
		try {
			localStorage.setItem(SEEN_KEY, '1');
		} catch {
			// Without storage the picture simply shows again next time.
		}
	}

	function duration(ms: number): number {
		return matchMedia('(prefers-reduced-motion: reduce)').matches ? 1 : ms;
	}

	/** The keyframe that shrinks the picture onto the icon, cropped to an arch around the doorway. */
	function iconFrame(): Keyframe {
		const from = picture!.getBoundingClientRect();
		const to = iconImage!.getBoundingClientRect();
		const scale = to.height / from.height;
		const width = to.width / scale;
		const left = Math.min(Math.max(DOORWAY_X * from.width - width / 2, 0), from.width - width);
		const right = from.width - left - width;
		const rx = width / 2;
		const ry = rx * 0.9;
		return {
			clipPath: `inset(0px ${right}px 0px ${left}px round ${rx}px ${rx}px 0px 0px / ${ry}px ${ry}px 0px 0px)`,
			transform: `translate(${to.left - from.left - left * scale}px, ${to.top - from.top}px) scale(${scale})`
		};
	}

	function clearAnimations() {
		[picture, caption, backdrop].forEach((element) => element?.getAnimations().forEach((a) => a.cancel()));
	}

	function collapse() {
		if (!open || animating || !picture || !iconImage) return;
		animating = true;
		clearTimeout(timer);
		rememberSeen();
		const ms = duration(950);
		caption?.animate([{ opacity: 1 }, { opacity: 0 }], { duration: ms / 3, fill: 'forwards' });
		backdrop?.animate([{ opacity: 1 }, { opacity: 0 }], { duration: ms, easing: 'ease-in', fill: 'forwards' });
		picture.animate([FULL, iconFrame()], { duration: ms, easing: EASE, fill: 'forwards' }).onfinish = () => {
			open = false;
			animating = false;
			clearAnimations();
		};
	}

	async function expand() {
		if (open || animating) return;
		animating = true;
		open = true;
		await tick();
		const ms = duration(800);
		backdrop?.animate([{ opacity: 0 }, { opacity: 1 }], { duration: ms, easing: 'ease-out' });
		caption?.animate([{ opacity: 0 }, { opacity: 0, offset: 0.6 }, { opacity: 1 }], { duration: ms });
		picture!.animate([iconFrame(), FULL], { duration: ms, easing: EASE }).onfinish = () => {
			animating = false;
		};
	}

	/** Count down only while the page is on screen, so a background tab still opens on the picture. */
	function startTimer() {
		if (document.hidden) {
			document.addEventListener('visibilitychange', startTimer, { once: true });
			return;
		}
		timer = setTimeout(collapse, SHOW_FOR_MS);
	}

	$effect(() => {
		document.documentElement.classList.toggle('intro-open', open);
	});

	onMount(() => {
		if (open && picture) {
			if (picture.complete) startTimer();
			else picture.addEventListener('load', startTimer, { once: true });
		}
		return () => {
			clearTimeout(timer);
			document.removeEventListener('visibilitychange', startTimer);
			document.documentElement.classList.remove('intro-open');
		};
	});
</script>

<svelte:window onkeydown={collapse} onwheel={collapse} ontouchmove={collapse} />

<button type="button" class="icon" class:hidden={open} onclick={expand} aria-label="Show the picture" title="Show the picture">
	<img bind:this={iconImage} {src} alt="" />
</button>

<div class="splash" class:open role="presentation" onclick={collapse}>
	<div class="backdrop" bind:this={backdrop}></div>
	<figure>
		<img class="picture" bind:this={picture} {src} {alt} />
		<figcaption bind:this={caption}>
			<span class="heading" {lang}>{heading}</span>
			<span class="sc">{subtitle}</span>
			<button type="button" class="br enter">enter the library</button>
		</figcaption>
	</figure>
</div>

<style>
	:global(html.intro-open) {
		overflow: hidden;
	}

	.icon {
		flex: none;
		width: 40px;
		height: 52px;
		padding: 0;
		border: 1px solid var(--frame);
		border-radius: 20px 20px 0 0 / 18px 18px 0 0;
		overflow: hidden;
		background: var(--paper);
		cursor: zoom-in;
	}

	.icon.hidden {
		opacity: 0;
	}

	.icon img {
		display: block;
		width: 100%;
		height: 100%;
		object-fit: cover;
		/* Centres the doorway (DOORWAY_X) in the 38 × 50 window. */
		object-position: 34% 50%;
	}

	.splash {
		position: fixed;
		inset: 0;
		z-index: 50;
		display: none;
		cursor: pointer;
	}

	.splash.open {
		display: block;
	}

	.backdrop {
		position: absolute;
		inset: 0;
		background: var(--bg);
	}

	figure {
		position: absolute;
		inset: 0;
		margin: 0;
		padding: 24px;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 22px;
	}

	.picture {
		display: block;
		width: min(1100px, 92vw);
		aspect-ratio: 2048 / 768;
		object-fit: cover;
		transform-origin: 0 0;
	}

	figcaption {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 2px;
		text-align: center;
	}

	.heading {
		font-size: 30px;
		font-weight: 500;
	}

	figcaption .sc {
		font-size: 17px;
		color: var(--ink-soft);
	}

	.enter {
		margin-top: 12px;
		font-size: 18px;
	}

	@media (max-width: 720px) {
		.heading {
			font-size: 26px;
		}
	}
</style>
