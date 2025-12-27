<script lang="ts">
	import { base } from '$app/paths';

	const exampleClusters = [
		{ cluster: 'ಕ', description: 'Simple consonant: ka' },
		{ cluster: 'ಕಾ', description: 'Consonant + matra: kā (ka + ā sign)' },
		{ cluster: 'ಕ್', description: 'Consonant + halant: k (dead consonant)' },
		{ cluster: 'ಕ್ಷ', description: 'Conjunct: kṣa (ka + halant + ṣa)' },
		{ cluster: 'ಕ್ಷಾ', description: 'Conjunct + matra: kṣā' },
		{ cluster: 'ಕ್ಷಾಂ', description: 'Conjunct + matra + modifier: kṣāṃ' },
	];
</script>

<div class="page">
	<header>
		<h1>Technical Documentation</h1>
		<nav class="breadcrumb">
			<a href="{base}/">← Back to Library</a>
		</nav>
	</header>

	<article>
		<section class="intro">
			<p>
				This page explains the technical approach used in the Kannada Library of Babel and how
				it differs from the original implementation.
			</p>
		</section>

		<section>
			<h2>The Original Library of Babel</h2>
			<p>
				Jonathan Basile's <a href="https://libraryofbabel.info" target="_blank" rel="noopener">libraryofbabel.info</a>
				implements Borges' vision using a 29-character alphabet:
			</p>
			<ul>
				<li>26 lowercase English letters (a-z)</li>
				<li>Space, period, and comma</li>
			</ul>
			<p>
				Each page contains exactly 3,200 characters (40 lines × 80 characters). This creates
				29<sup>3200</sup> possible pages, a number so large it dwarfs the number of atoms in the
				observable universe.
			</p>
			<p>
				The original uses a clever mathematical encoding: each page's