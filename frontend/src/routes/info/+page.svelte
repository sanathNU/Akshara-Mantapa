<script lang="ts">
	// Example clusters for demonstration
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
				29<sup>3200</sup> possible pages—a number so large it dwarfs the number of atoms in the
				observable universe.
			</p>
			<p>
				The original uses a clever mathematical encoding: each page's content is converted to
				a base-29 number, which becomes its address. This makes the library fully invertible, meaning you can search for any text and get its exact location.
				Akshara-Mantapa uses the same principle but adapted for Kannada's complexity.
			</p>
		</section>

		<section>
			<h2>The Kannada Challenge</h2>
			<p>
				Kannada, like other Indic scripts, is fundamentally different from Latin alphabets.
				It doesn't use individual letters that combine linearly. Instead, it uses grapheme clusters,
				which are visual units that combine consonants, vowels, and modifiers in complex ways.
			</p>

			<h3>What is a Grapheme Cluster?</h3>
			<p>
				A grapheme cluster is the smallest unit of writing that a reader perceives as a single
				character. In Kannada, these clusters can be:
			</p>

			<div class="examples">
				{#each exampleClusters as example}
					<div class="example-card">
						<div class="cluster-display">{example.cluster}</div>
						<div class="cluster-desc">{example.description}</div>
					</div>
				{/each}
			</div>

			<p>
				Notice how a single "character" like <span class="kannada-large">ಕ್ಷಾಂ</span> is actually
				composed of four Unicode codepoints: consonant (ಕ) + halant (್) + consonant (ಷ) + matra (ಾ) + modifier (ಂ).
				But visually and linguistically, it's perceived as one unit.
			</p>
		</section>

		<section>
			<h2> Grapheme-Based Alphabet</h2>
			<p>
				This implementation treats each grapheme cluster as a single "letter" in our alphabet.
				Instead of 29 characters, we have <strong>56,028 distinct grapheme clusters</strong>.
			</p>

			<h3>Building the Alphabet</h3>
			<p>All Kannada Alphabet Clusters are systematically generated:</p>

			<ol class="tech-list">
				<li>
					<strong>Punctuation</strong>: Space, period, comma, etc.
					<div class="code-block">Examples: " ", ".", ",", "!", "?"</div>
				</li>
				<li>
					<strong>Independent vowels</strong>: ಅ, ಆ, ಇ, ಈ, ಉ, ಊ, ಋ, etc.
					<div class="code-block">14 vowels × (1 + 2 modifiers) = 42 clusters</div>
				</li>
				<li>
					<strong>Simple consonants</strong>: ಕ, ಖ, ಗ, ಘ, ಙ, etc.
					<div class="code-block">36 consonants</div>
				</li>
				<li>
					<strong>Consonants with matras</strong>: ಕಾ, ಕಿ, ಕೀ, etc.
					<div class="code-block">36 consonants × 13 matras × (1 + 2 modifiers) = 1,404 clusters</div>
				</li>
				<li>
					<strong>Consonants with modifiers</strong>: ಕಂ, ಕಃ
					<div class="code-block">36 consonants × 2 modifiers = 72 clusters</div>
				</li>
				<li>
					<strong>Dead consonants</strong>: ಕ್, ಖ್, ಗ್, etc.
					<div class="code-block">36 consonants with halant</div>
				</li>
				<li>
					<strong>Conjuncts (2-consonant clusters)</strong>: ಕ್ಕ, ಕ್ಖ, ಕ್ಗ, etc.
					<div class="code-block">36 × 36 = 1,296 base conjuncts</div>
					<div class="code-block">× 13 matras × (1 + 2 modifiers) = 50,544 additional clusters</div>
					<div class="code-block">× 2 modifiers = 2,592 additional clusters</div>
				</li>
			</ol>

			<p>
				This gives us <strong>56,028 total clusters</strong>—each one a valid, meaningful unit
				of Kannada text.
			</p>
		</section>

		<section>
			<h2>Bijective Mapping</h2>
			<p>
				Akshara-Mantapa uses a <strong>single, fully invertible bijective mapping</strong> using
				multiplicative inverse modular arithmetic. Every page has exactly one address, and every
				address generates exactly one page.
			</p>

			<h3>The Mathematics</h3>
			<p>
				The bijection uses a coprime multiplier and its modular inverse:
			</p>

			<div class="address-type">
				<h4>Formula</h4>
				<pre class="code">content_num = Σ (cluster_index[i] × 56028^i) for i in 0..410
address = (content_num × C) mod N
content_num = (address × I) mod N

Where:
- N = 56028^410 (modulus, total possible pages)
- C = coprime multiplier (chosen at startup)
- I = C^(-1) mod N (modular inverse)</pre>

				<p>
					This creates a perfect one-to-one mapping. Unlike hash functions, the modular inverse
					allows us to go both directions: content → address AND address → content.
				</p>
			</div>

			<h3>Address Formats</h3>

			<div class="address-type">
				<h4>1. Raw Hex Address</h4>
				<code class="address-example">93cebf0ea1c7096fe3de06fd119f...</code>
				<p>
					The raw address is ~1,618 hexadecimal characters (~6,468 bits):
				</p>
				<ul>
					<li>Directly encodes the bijective mapping result</li>
					<li>Fully invertible to page content</li>
					<li>Can be used directly in API calls</li>
				</ul>
			</div>

			<div class="address-type">
				<h4>2. Hierarchical Address</h4>
				<code class="address-example">24ea75...849e4ebd.4.4.23.325</code>
				<p>
					Borges-faithful structure mirroring the physical library:
				</p>
				<ul>
					<li><strong>mandira</strong> (ಮಂದಿರ): Room identifier (~1,600 hex chars)</li>
					<li><strong>gode</strong> (ಗೋಡೆ): Wall number (1-4)</li>
					<li><strong>patti</strong> (ಪಟ್ಟಿ): Shelf number (1-5)</li>
					<li><strong>pustaka</strong> (ಪುಸ್ತಕ): Book number (1-32)</li>
					<li><strong>puta</strong> (ಪುಟ): Page number (1-410)</li>
				</ul>
				<p class="note">
					Both formats represent the same page. They are simply different ways of displaying the same underlying address.
				</p>
			</div>

		</section>

		<section>
			<h2>How Content Generation Works</h2>

			<h3>Search: Text → Address</h3>
			<pre class="code">
1. Take search query: "ಕನ್ನಡ"
2. Segment into clusters: ["ಕ", "ನ್", "ನ", "ಡ"]
3. Convert each cluster to alphabet index
4. Pad to 410 clusters with spaces (index 0)
5. Convert to base-56,028 number (content_num)
6. Apply bijection: address = (content_num × C) mod N
7. Convert to hex and hierarchical formats</pre>

			<h3>Browse: Address → Text</h3>
			<pre class="code">
1. Take hex address (or convert from hierarchical)
2. Apply inverse: content_num = (address × I) mod N
3. Convert content_num to 410 base-56,028 indices
4. Map each index to its grapheme cluster
5. Format as 41 clusters per line, 10 lines</pre>

			<p class="note">
				Both operations are O(n²), where n ≈ 6,500 bits. 
				Despite the enormous address space, generation is instant, usually under a millisecond.
			</p>
		</section>

		<section>
			<h2>Comparison Summary</h2>

			<table class="comparison">
				<thead>
					<tr>
						<th>Aspect</th>
						<th>Original (English)</th>
						<th>Akshara-Mantapa (Kannada)</th>
					</tr>
				</thead>
				<tbody>
					<tr>
						<td>Alphabet Size</td>
						<td>29 characters</td>
						<td>56,028 grapheme clusters</td>
					</tr>
					<tr>
						<td>Page Length</td>
						<td>3,200 characters</td>
						<td>410 clusters (Borges-faithful)</td>
					</tr>
					<tr>
						<td>Total Pages</td>
						<td>29<sup>3200</sup> ≈ 10<sup>4677</sup></td>
						<td>56,028<sup>410</sup> ≈ 10<sup>1947</sup></td>
					</tr>
					<tr>
						<td>Address Size</td>
						<td>~500 hex chars</td>
						<td>~1,618 hex chars</td>
					</tr>
					<tr>
						<td>Address System</td>
						<td>Single invertible (base conversion)</td>
						<td>Single invertible (multiplicative inverse)</td>
					</tr>
					<tr>
						<td>Hierarchical Display</td>
						<td>Wall.Shelf.Volume.Page</td>
						<td>Mandira.Gode.Patti.Pustaka.Puta</td>
					</tr>
					<tr>
						<td>Segmentation</td>
						<td>Character-by-character</td>
						<td>Grapheme cluster parsing</td>
					</tr>
					<tr>
						<td>Script Complexity</td>
						<td>Simple (Latin alphabet)</td>
						<td>Complex (Indic script with conjuncts)</td>
					</tr>
					<tr>
						<td>All Pages Searchable</td>
						<td>Yes</td>
						<td>Yes</td>
					</tr>
				</tbody>
			</table>
		</section>

		<section>
			<h2>Technical Implementation</h2>
			<p>
				The backend is built with Rust for performance and type safety:
			</p>
			<ul>
				<li><strong>Axum</strong> - Modern async web framework</li>
				<li><strong>num-bigint</strong> - Arbitrary precision arithmetic for 6,468-bit numbers</li>
				<li><strong>num-integer</strong> - Integer operations (GCD for computing modular inverse)</li>
				<li><strong>Bijection Engine</strong> - Multiplicative inverse modular arithmetic</li>
				<li><strong>Grapheme Alphabet</strong> - Systematic generation of 56,028 Kannada clusters</li>
				<li><strong>Serde</strong> - JSON serialization for API responses</li>
			</ul>
			<p>
				The frontend uses SvelteKit with TypeScript for a minimal, fast, reactive user interface.
			</p>
			<p class="note">
				First startup takes ~5 seconds to compute the bijection constants (C and I) using the
				extended Euclidean algorithm. Subsequent requests are instant.
			</p>
		</section>

		<section class="links">
			<h2>Further Reading</h2>
			<ul>
				<li>
					<a href="/about">About Page</a> - Philosophy and background
				</li>
				<li>
					<a href="https://github.com/unicode-org/cldr" target="_blank" rel="noopener">
						Unicode CLDR
					</a> - Kannada character specifications
				</li>
				<li>
					<a href="https://libraryofbabel.info/theory.html" target="_blank" rel="noopener">
						Original Theory
					</a> - How the English version works
				</li>
			</ul>
		</section>
	</article>

	<footer>
		<p>
			<a href="..">Return to the Library</a>
		</p>
	</footer>
</div>

<style>
	.page {
		max-width: 50em;
		margin: 0 auto;
		padding: 3em 2em 2em 2em;
		font-family: 'Georgia', 'Palatino Linotype', 'Book Antiqua', 'Palatino', serif;
		font-size: 18px;
		line-height: 1.6;
		color: #000;
		background: #fff;
	}

	header {
		margin-bottom: 2em;
		border-bottom: 1px solid #ccc;
		padding-bottom: 1em;
	}

	h1 {
		font-size: 2em;
		font-weight: normal;
		margin: 0 0 0.5em 0;
		line-height: 1.2;
	}

	.breadcrumb {
		font-size: 0.9em;
	}

	.breadcrumb a {
		color: #666;
		text-decoration: none;
		border-bottom: 1px dotted #999;
	}

	.breadcrumb a:hover {
		color: #000;
		border-bottom-style: solid;
	}

	h2 {
		font-size: 1.4em;
		font-weight: normal;
		margin: 2em 0 0.75em 0;
		border-bottom: 1px solid #ddd;
		padding-bottom: 0.25em;
	}

	h3 {
		font-size: 1.15em;
		font-weight: 600;
		margin: 1.5em 0 0.5em 0;
	}

	h4 {
		font-size: 1.05em;
		font-weight: 600;
		margin: 1em 0 0.5em 0;
	}

	section {
		margin: 2em 0;
	}

	p {
		margin: 0 0 1em 0;
		text-align: justify;
	}

	a {
		color: #0066cc;
		text-decoration: none;
		border-bottom: 1px solid #ccc;
	}

	a:hover {
		border-bottom-color: #0066cc;
	}

	.kannada-large {
		font-family: 'Noto Sans Kannada', serif;
		font-size: 1.3em;
		font-weight: 600;
		color: #c30;
	}

	.examples {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
		gap: 1em;
		margin: 1.5em 0;
	}

	.example-card {
		background: #fafafa;
		border: 1px solid #ddd;
		padding: 1em;
		text-align: center;
	}

	.cluster-display {
		font-family: 'Noto Sans Kannada', serif;
		font-size: 2.5em;
		font-weight: 600;
		color: #c30;
		margin-bottom: 0.5em;
	}

	.cluster-desc {
		font-size: 0.85em;
		color: #666;
		font-family: 'Courier New', monospace;
	}

	.tech-list {
		margin: 1em 0 1em 1.5em;
		padding: 0;
	}

	.tech-list li {
		margin: 1em 0;
		padding-left: 0.5em;
	}

	.tech-list strong {
		font-weight: 600;
	}

	.code-block {
		font-family: 'Courier New', monospace;
		font-size: 0.85em;
		background: #f5f5f5;
		padding: 0.5em;
		margin: 0.5em 0 0 0;
		border-left: 3px solid #ccc;
		color: #333;
	}

	.address-type {
		background: #fafafa;
		border: 1px solid #ddd;
		padding: 1.5em;
		margin: 1.5em 0;
	}

	.address-type h4 {
		margin-top: 0;
	}

	.address-example {
		display: block;
		font-family: 'Courier New', monospace;
		font-size: 0.9em;
		background: #fff;
		padding: 0.75em;
		border: 1px solid #ccc;
		margin: 0.5em 0 1em 0;
		color: #c30;
		font-weight: 600;
	}

	.address-type ul {
		margin: 0.5em 0 0.5em 1.5em;
		padding: 0;
	}

	.address-type li {
		margin: 0.5em 0;
	}

	.note {
		font-size: 0.9em;
		color: #666;
		font-style: italic;
		background: #fff;
		padding: 0.75em;
		border-left: 3px solid #999;
		margin: 1em 0 0 0;
	}

	code {
		font-family: 'Courier New', monospace;
		font-size: 0.9em;
		background: #f0f0f0;
		padding: 0.1em 0.3em;
		border: 1px solid #ddd;
	}

	pre.code {
		font-family: 'Courier New', monospace;
		font-size: 0.85em;
		background: #f5f5f5;
		padding: 1em;
		border: 1px solid #ddd;
		overflow-x: auto;
		line-height: 1.5;
		margin: 1em 0;
	}

	.comparison {
		width: 100%;
		border-collapse: collapse;
		margin: 1.5em 0;
		font-size: 0.95em;
	}

	.comparison th,
	.comparison td {
		padding: 0.75em;
		text-align: left;
		border: 1px solid #ddd;
	}

	.comparison thead {
		background: #f5f5f5;
		font-weight: 600;
	}

	.comparison tbody tr:nth-child(even) {
		background: #fafafa;
	}

	.comparison sup {
		font-size: 0.7em;
	}

	.links ul {
		list-style: none;
		padding: 0;
	}

	.links li {
		margin: 0.75em 0;
		padding-left: 1.5em;
		position: relative;
	}

	.links li:before {
		content: '→';
		position: absolute;
		left: 0;
		color: #999;
	}

	footer {
		border-top: 1px solid #ccc;
		padding-top: 1em;
		margin-top: 3em;
		font-size: 0.9em;
		color: #666;
		text-align: center;
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

		.examples {
			grid-template-columns: 1fr;
		}

		.comparison {
			font-size: 0.85em;
		}

		.comparison th,
		.comparison td {
			padding: 0.5em;
		}
	}
</style>
