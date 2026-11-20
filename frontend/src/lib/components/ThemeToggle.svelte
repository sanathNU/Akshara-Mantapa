<script lang="ts">
	// ◐ switches between light and dark and remembers the choice; app.html applies it on load.
	const STORAGE_KEY = 'akshara.theme';

	let dark = $state(document.documentElement.dataset.theme === 'dark');

	function toggle() {
		dark = !dark;
		document.documentElement.dataset.theme = dark ? 'dark' : 'light';
		try {
			localStorage.setItem(STORAGE_KEY, dark ? 'dark' : 'light');
		} catch {
			// Private windows can refuse storage; the switch still works for this visit.
		}
	}
</script>

<button
	type="button"
	class="mode"
	onclick={toggle}
	aria-pressed={dark}
	aria-label="Dark mode"
	title={dark ? 'Switch to light mode' : 'Switch to dark mode'}>◐</button
>

<style>
	.mode {
		background: none;
		border: 0;
		padding: 0 2px;
		color: var(--ink);
		font: 22px/1 serif;
		cursor: pointer;
	}

	.mode:hover {
		color: var(--warm);
	}
</style>
