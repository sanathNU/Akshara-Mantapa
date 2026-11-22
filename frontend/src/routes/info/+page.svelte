<script lang="ts">
	import DocPage from '$lib/components/DocPage.svelte';
	import BookDiagram from '$lib/components/BookDiagram.svelte';
	import BookStair from '$lib/components/BookStair.svelte';
	import { SCRIPT_CONFIG } from '$lib/api';
	import { bookOf, randomAddress, seededRandom, shelfNeighbours } from '$lib/cover';
	import { base } from '$app/paths';

	// The book the covers section draws: the same one on every visit (an ochre book with a full-length
	// room), until [another book] picks one at random.
	const ALPHABET = SCRIPT_CONFIG.kannada.alphabetSize;
	let exampleAddress = $state(randomAddress(ALPHABET, seededRandom(20261164)));
	const anotherBook = () => (exampleAddress = randomAddress(ALPHABET));
	const example = $derived(bookOf(exampleAddress, 'kannada'));
	const neighbours = $derived(example ? shelfNeighbours(example, 8) : []);

	const COVER_KEY = [
		'The room number, one hex digit per row, most significant first. A filled hole is a 1.',
		'The last three rows, in a different colour: the wall, shelf and book.',
		'The colour itself, picked by the last four bits of the book number.',
		'The label, where the book stands, written out in Kannada.'
	];
	const STAIR_KEY = [
		'The ring round the well: the book’s binding, the same colour as its cover.',
		'The steps, between 14 and 21 to a turn depending on the book.',
		'This book’s step, one turn down, in the accent.',
		'The bottom. Some stairs show a turn and a half before it goes dark, some go down seven and a half.'
	];

	const exampleClusters = [
		{ cluster: 'ಕ', description: 'Simple consonant: ka' },
		{ cluster: 'ಕಾ', description: 'Consonant + matra: kā' },
		{ cluster: 'ಕ್', description: 'Dead consonant: k (with halant)' },
		{ cluster: 'ಕ್ಷ', description: 'Conjunct: kṣa (ka + halant + ṣa)' },
		{ cluster: 'ಕ್ಷಾ', description: 'Conjunct + matra: kṣā' },
		{ cluster: 'ರ್ನ್', description: 'Dead conjunct: rn (no trailing vowel)' },
	];
</script>

<svelte:head>
	<title>Technical documentation · Akshara Mantapa</title>
</svelte:head>

<DocPage
	label="Info"
	title="Technical Documentation"
	subtitle="This page explains the technical approach used in the Kannada Library of Babel and how it differs from the original implementation."
>
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
						<div class="cluster-display" lang="kn">{example.cluster}</div>
						<div class="cluster-desc">{example.description}</div>
					</div>
				{/each}
			</div>

			<p>
				Notice how a single "character" like <span class="kannada-large" lang="kn">ಕ್ಷಾಂ</span> is actually
				composed of five Unicode codepoints: consonant (ಕ) + halant (್) + consonant (ಷ) + matra (ಾ) + modifier (ಂ).
				But visually and linguistically, it's perceived as one unit.
			</p>
		</section>

		<section>
			<h2>Grapheme-Based Alphabet</h2>
			<p>
				This implementation treats each grapheme cluster as a single "letter" in our alphabet.
				Instead of 29 characters, we have <strong>57,324 distinct grapheme clusters</strong>.
			</p>

			<h3>Building the Alphabet</h3>
			<p>All Kannada Alphabet Clusters are systematically generated:</p>

			<ol class="tech-list">
				<li>
					<strong>Punctuation</strong>: Space, period, comma, etc.
					<div class="code-block">Examples: " ", ".", ",", "!", "?", "।"</div>
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
					<div class="code-block">36 consonants with halant = 36 clusters</div>
				</li>
				<li>
					<strong>Conjuncts (2-consonant clusters)</strong>: ಕ್ಕ, ಕ್ಖ, ಕ್ಗ, etc.
					<div class="code-block">36 × 36 = 1,296 base conjuncts</div>
					<div class="code-block">With matras: × 13 × (1 + 2 modifiers) = 50,544 clusters</div>
					<div class="code-block">With modifiers only: × 2 = 2,592 clusters</div>
				</li>
				<li>
					<strong>Dead conjuncts</strong>: ರ್ನ್, ಸ್ಟ್, ಕ್ಷ್, etc.
					<div class="code-block">36 × 36 = 1,296 clusters</div>
				</li>
			</ol>

			<p>
				This gives us <strong>57,324 total clusters</strong>, each one a valid, meaningful unit
				of Kannada text.
			</p>

			<h3>The Dead Conjunct Problem</h3>
			<p>
				A <strong>dead conjunct</strong> occurs when a conjunct itself ends with a halant, indicating 
				no vowel sound follows. This happens commonly in transliterated English words or Sanskrit terms.
				For example, "ನಾರ್ಥೆಸ್ಟರ್ನ್" (Northeastern) ends with ರ್ನ್, which is:
			</p>
			<div class="code-block">ರ + ್ + ನ + ್ (ra + halant + na + halant)</div>
			<p>
				This four-character sequence forms a single visual unit. Without dead conjuncts in the alphabet, 
				such words would be unsearchable. Adding the 1,296 dead conjuncts (36 × 36) ensures every valid 
				Kannada text can be found.
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
				<pre class="code">content_num = Σ (cluster_index[i] × 57324^i) for i in 0..400
address = (content_num × C) mod N
content_num = (address × I) mod N

Where:
- N = 57324^400 (modulus, total possible pages)
- C = fixed multiplier: the first 39 digits of π,
      raised to the next value coprime to N
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
					The raw address is up to about 1,581 hexadecimal characters (~6,323 bits):
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
					<li><strong>mandira</strong> (ಮಂದಿರ): Room identifier (~1,577 hex chars)</li>
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
2. Segment into clusters (greedy longest match): ["ಕ", "ನ್ನ", "ಡ"]
3. Convert each cluster to alphabet index
4. Place them at a random position and fill the rest of the
   400 clusters at random, so every search lands somewhere new
5. Convert to base-57,324 number (content_num)
6. Apply bijection: address = (content_num × C) mod N
7. Convert to hex and hierarchical formats</pre>

			<h3>Browse: Address → Text</h3>
			<pre class="code">
1. Take hex address (or convert from hierarchical)
2. Apply inverse: content_num = (address × I) mod N
3. Convert content_num to 400 base-57,324 indices
4. Map each index to its grapheme cluster
5. Format as 25 clusters per line, 16 lines</pre>

			<p class="note">
				Both operations are O(n²), where n ≈ 6,300 bits.
				Despite the enormous address space, generation is instant, usually under a millisecond.
			</p>
		</section>

		<section>
			<h2>The Book Covers</h2>
			<p>
				In Borges' library every book looks the same from the outside. Same size, same binding, no title on
				the spine. The only thing that makes a <span lang="kn">ಪುಸ್ತಕ</span> that particular
				<span lang="kn">ಪುಸ್ತಕ</span> is where it sits. So every book here gets a cover made out of exactly
				that: its address.
			</p>

			<BookDiagram rawAddress={exampleAddress} script="kannada" kind="cover" key={COVER_KEY} onanother={anotherBook} />

			<p>
				It's punched paper tape, the kind old computers read their programs from. Each row holds one hex
				digit of the room number (the <span lang="kn">ಮಂದಿರ</span>), four holes to a row. A room number runs
				to about 1,577 hex digits and the tape fits around 140 of them, so think of it as a signature rather
				than the full name. The last three rows spell out where the book sits: 2 bits for the
				<span lang="kn">ಗೋಡೆ</span>, 3 for the <span lang="kn">ಪಟ್ಟಿ</span> and 5 for the
				<span lang="kn">ಪುಸ್ತಕ</span>.
			</p>
			<div class="note">
				<p>
					Yes, this means the tape isn't unique. With 140 digits out of 1,577, every tape is shared with
					about 10<sup>1,729</sup> other books (a nice number, if you're Ramanujan). In my defence, there are
					around 10<sup>171</sup> possible tapes, which is more than the number of atoms in the observable
					universe (about 10<sup>80</sup>), squared. Turn every atom into a book and you'd still probably
					never find two matching tapes. The universe is just too small for this library.
				</p>
			</div>
			<p>
				The colour comes from the last four bits of the book number, one of sixteen bindings, so a shelf of
				32 books runs through all of them twice. Where the tape is torn and how the strips are staggered is
				seeded from the whole address, so even two books with the same holes almost never look alike. The
				page number gets thrown away first, which means all 410 pages of a book share one cover.
			</p>
			<div class="note">
				<p>
					One quirk: <code>[random page]</code> starts from a 256-bit address, so those rooms are short
					(around 60 hex digits) and the tape runs out after a couple of strips. Pages you find by searching
					usually sit in full-length rooms and fill the whole tape. I left it like that on purpose. A
					half-empty tape is honest about where you are.
				</p>
			</div>
			<p>
				Any cover can be saved with <code>[download cover]</code>, and it's also the cover of the EPUB you
				get from <code>[download book]</code>.
			</p>

			<h3>The Spiral Stairs</h3>
			<p>
				Borges puts a spiral stairway next to every hexagon, one that sinks forever below you and climbs
				forever above. I liked that too much to leave out, so every page in your history list gets a little
				one: a round well seen from above, the steps hugging the wall, and a dark bottom you never quite
				reach.
			</p>

			<BookDiagram rawAddress={exampleAddress} script="kannada" kind="stair" key={STAIR_KEY} onanother={anotherBook} />

			<p>
				Like the cover, the stair belongs to the book and not the page. Steps per turn, how deep you can see,
				which way it winds and where the top step starts are all seeded from the book's address. Every page
				of a book gets the same stair, which turns out to be handy: scroll through your history and the pages
				that came out of one book jump out at you.
			</p>

			{#if example}
				<div class="stair-row">
					{#each neighbours as n, i (n.slot)}
						<figure class:on={i === 0}>
							<BookStair rawAddress={n.address} script="kannada" size={48} />
							<figcaption>{n.slot}</figcaption>
						</figure>
					{/each}
				</div>
				<p class="row-caption">
					Books {example.slot} onwards on wall {example.wall}, shelf {example.shelf}. Neighbours differ in
					their last bits, so each gets its own colour, and every bit goes into the seed, so each gets its
					own stair.
				</p>
			{/if}
		</section>

		<section>
			<h2>Comparison Summary</h2>

			<div class="table-wrap">
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
						<td>57,324 grapheme clusters</td>
					</tr>
					<tr>
						<td>Page Length</td>
						<td>3,200 characters</td>
						<td>400 clusters (Borges-faithful)</td>
					</tr>
					<tr>
						<td>Total Pages</td>
						<td>29<sup>3200</sup> ≈ 10<sup>4677</sup></td>
						<td>57,324<sup>400</sup> ≈ 10<sup>1,903</sup></td>
					</tr>
					<tr>
						<td>Address Size</td>
						<td>~500 hex chars</td>
						<td>~1,581 hex chars</td>
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
			</div>
		</section>

		<section>
			<h2>Technical Implementation</h2>
			<p>
				The backend is built with Rust for performance and type safety:
			</p>
			<ul>
				<li><strong>Axum</strong> for the async web framework</li>
				<li><strong>num-bigint</strong> for arbitrary precision arithmetic with ~6,300-bit numbers</li>
				<li><strong>num-integer</strong> for integer operations like GCD for computing modular inverse</li>
				<li><strong>Bijection Engine</strong> using multiplicative inverse modular arithmetic</li>
				<li><strong>Grapheme Alphabet</strong> with systematic generation of 57,324 Kannada clusters</li>
				<li><strong>Serde</strong> for JSON serialization for API responses</li>
				<li><strong>wasm-bindgen</strong> for WebAssembly compilation for browser deployment</li>
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
					<a href="{base}/about">About Page</a> for philosophy and background
				</li>
				<li>
					<a href="https://github.com/unicode-org/cldr" target="_blank" rel="noopener">
						Unicode CLDR
					</a> for Kannada character specifications
				</li>
				<li>
					<a href="https://libraryofbabel.info/theory.html" target="_blank" rel="noopener">
						Original Theory
					</a> for how the English version works
				</li>
			</ul>
		</section>
	</DocPage>

<style>
	/* The covers section: the example book's shelf, as a row of stairs. */
	.stair-row {
		display: grid;
		grid-template-columns: repeat(8, minmax(0, 1fr));
		gap: 12px;
		max-width: 520px;
		margin: 4px 0 6px;
	}

	.stair-row figure {
		margin: 0;
		display: grid;
		gap: 2px;
		justify-items: center;
		font-size: 15px;
		color: var(--muted);
		font-variant-numeric: lining-nums;
	}

	.stair-row figure :global(.stair) {
		max-width: 100%;
	}

	.stair-row .on {
		color: var(--warm);
		font-weight: 600;
	}

	.row-caption {
		font-size: 17px;
		color: var(--muted);
	}

	@media (max-width: 720px) {
		.stair-row {
			grid-template-columns: repeat(4, minmax(0, 1fr));
		}
	}
</style>
