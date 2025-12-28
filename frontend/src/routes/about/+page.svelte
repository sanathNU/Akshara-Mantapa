<script>
	import { base } from '$app/paths';
</script>

<div class="page">
	<header>
		<h1>∞ ಅಕ್ಷರ ಮಂಟಪ | Akshara-Mantapa</h1>
		<nav class="breadcrumb">
			<a href="{base}/">← Back to Library</a>
		</nav>
	</header>

	<article>
		<section class="intro kannada-section">
			<h2>ಅಕ್ಷರ ಮಂಟಪ</h2>
			<p>
				ಜಾರ್ಜ್ ಲೂಯಿಸ್ ಬೋರ್ಗೆಸ್ ಅವರ ೧೯೪೧ ರ ಕಿರು ಕಥೆ "ದಿ ಲೈಬ್ರರಿ ಆಫ್ ಬ್ಯಾಬೆಲ್" ನಿಂದ ಸ್ಫೂರ್ತಿ ಪಡೆದ ಈ ಯೋಜನೆಯು
				ಅನಂತ ಮತ್ತು ನಿರ್ಧಾರಿತ ಗ್ರಂಥಾಲಯದ ಪರಿಕಲ್ಪನೆಯನ್ನು ಕನ್ನಡ ಭಾಷೆಗೆ ತರುತ್ತದೆ.
			</p>
			<p>
				ಈ ಗ್ರಂಥಾಲಯವು ೪೧೦ ಅಕ್ಷರಗುಚ್ಛಗಳ ಪ್ರತಿಯೊಂದು ಸಂಭವನೀಯ ಕನ್ನಡ ಪಠ್ಯವನ್ನು ಒಳಗೊಂಡಿದೆ.
				ಏಕೈಕ, ಸುಂದರವಾದ ದ್ವಿಮುಖ ಮ್ಯಾಪಿಂಗ್ ಮೂಲಕ, ಪ್ರತಿಯೊಂದು ಪಠ್ಯವು ನಿಖರವಾಗಿ ಒಂದು ವಿಳಾಸವನ್ನು ಹೊಂದಿದೆ.
				ಯಾವುದೇ ಕನ್ನಡ ಪಠ್ಯಕ್ಕಾಗಿ ಹುಡುಕಿ, ಮತ್ತು ಗ್ರಂಥಾಲಯವು ಅದರ ನಿಖರವಾದ ಸ್ಥಳವನ್ನು ತೋರಿಸುತ್ತದೆ.
			</p>
		</section>

		<section class="intro">
			<h2>Akshara-Mantapa: A Library of Babel for Kannada</h2>
			<p>
				Inspired by Jorge Luis Borges' 1941 short story "The Library of Babel," Akshara-Mantapa
				brings the concept of an infinite, deterministic library to the Kannada language.
			</p>
			<p>
				The library contains every possible combination of 410-cluster Kannada text. Through an
				elegant bijective mapping using multiplicative inverse modular arithmetic, each text has
				exactly one address, and each address generates exactly one page. The system is fully
				invertible—search for any text and find its unique location; browse any address and
				deterministically generate its content.
			</p>
			<p>
				With 56,028 grapheme clusters (including consonants, vowels, matras, modifiers, and conjuncts),
				the library contains 56,028^410 ≈ 10^1,947 possible pages—a number incomprehensibly vast,
				yet every page is instantly accessible and searchable.
			</p>
		</section>

		<section class="philosophy">
			<h2>The Original Vision</h2>
			<blockquote>
				"The universe (which others call the Library) is composed of an indefinite and perhaps
				infinite number of hexagonal galleries, with vast air shafts between, surrounded by very
				low railings. From any of the hexagons one can see, interminably, the upper and lower floors."
				<footer>— Jorge Luis Borges, "The Library of Babel"</footer>
			</blockquote>
			<p>
				Borges imagined a library containing all possible 410-page books, each with 40 lines
				per page and 80 characters per line. Akshara-Mantapa faithfully preserves this structure
				with 410-cluster pages, but uses Kannada's 56,028 grapheme clusters instead of the limited
				Latin alphabet—creating a space incomparably vaster yet equally navigable.
			</p>
			<p>
				The hierarchical addressing mirrors Borges' physical structure: mandira (room), gode (wall),
				patti (shelf), pustaka (book), and puta (page)—allowing you to locate any text in this
				infinite library with precision.
			</p>
		</section>

		<section class="monkey-theorem">
			<h2>The Infinite Monkey Theorem</h2>
			<p>
				The Library of Babel is closely related to the famous <strong>Infinite Monkey Theorem</strong>, 
				the idea that a monkey hitting keys at random on a typewriter for an infinite amount of time will 
				almost surely type any given text, including the complete works of Shakespeare.
			</p>
			<p>
				But here's the twist: Akshara-Mantapa doesn't need infinite time or random chance. Through 
				deterministic mathematics, every possible text <em>already exists</em> at a calculable address. 
				The monkey has already typed everything. We just need to know where to look.
			</p>
			<p>
				This transforms a probabilistic thought experiment into a navigable reality. Every Kannada 
				poem ever written, every poem that could be written, every nonsensical string of characters, 
				all exist simultaneously, waiting to be discovered.
			</p>
		</section>

		<section class="why-section">
			<h2>Why Build This?</h2>
			
			<h3>ಕನ್ನಡ, My Mother Tongue</h3>
			<p>
				Kannada is my mother tongue, and I wanted a way to think about infinity in that language. 
				There's something profound about knowing that every possible expression in your native 
				script exists somewhere in a mathematical structure. Every story my grandmother could tell, 
				every poem yet to be composed, every thought waiting to be articulated.
			</p>

			<h3>The Technical Challenge</h3>
			<p>
				Implementing a Library of Babel for an Indic script presents unique challenges that don't 
				exist for Latin alphabets. Kannada uses grapheme clusters, which are complex combinations of consonants, 
				vowels, matras, and modifiers that behave as single visual units. Building a bijective mapping 
				over 56,028 such clusters, ensuring mathematical correctness with around 6,300-bit arithmetic, and 
				making it all run efficiently in both native and WebAssembly contexts were irresistible 
				puzzles to solve.
			</p>

			<h3>Because Why Not?</h3>
			<p>
				It's an infinite Pandora's box to build, implement, and improvise upon. The beauty of such 
				a project is that it's never truly finished. There's always another optimization, another 
				feature, another way to explore the incomprehensible vastness. Sometimes the best reason 
				to build something is the sheer joy of building it.
			</p>
		</section>

		<section class="links">
			<h2>Learn More</h2>
			<ul>
				<li>
					<a href="{base}/info">Technical Documentation</a> for how the clustering and encoding works
				</li>
				<li>
					<a href="https://en.wikipedia.org/wiki/The_Library_of_Babel" target="_blank" rel="noopener">
						Original Story
					</a> to read Borges' short story
				</li>
				<li>
					<a href="https://libraryofbabel.info" target="_blank" rel="noopener">
						Original Implementation
					</a> by Jonathan Basile for the English version
				</li>
				<li>
					<a href="https://youtu.be/GDrBIKOR01c?t=1032" target="_blank" rel="noopener">
						Vsauce Explanation
					</a> where Michael Stevens explores the Library of Babel and infinity
				</li>
				<li>
					<a href="https://en.wikipedia.org/wiki/Infinite_monkey_theorem" target="_blank" rel="noopener">
						Infinite Monkey Theorem
					</a> on the probabilistic thought experiment
				</li>
			</ul>
		</section>
	</article>

	<footer>
		<p class="return-link">
			<a href="{base}/">Return to the Library</a>
		</p>
		<div class="made-by">
			<p>Made by <strong>Sanath</strong></p>
			<p class="links">
				<a href="https://github.com/sanathNU" target="_blank" rel="noopener">GitHub</a>
				<span class="separator">•</span>
				<a href="https://sanathnu.github.io/TechnicaInsania/" target="_blank" rel="noopener">Website</a>
			</p>
		</div>
	</footer>
</div>

<style>
	.page {
		max-width: 46em;
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
		font-size: 1.3em;
		font-weight: normal;
		margin: 1.5em 0 0.75em 0;
		border-bottom: 1px solid #eee;
		padding-bottom: 0.25em;
	}

	h3 {
		font-size: 1.1em;
		font-weight: 600;
		margin: 1.25em 0 0.5em 0;
		color: #333;
	}

	section {
		margin: 2em 0;
	}

	.kannada-section {
		background: #fafafa;
		border: 1px solid #e0e0e0;
		padding: 1.5em;
		margin-bottom: 2.5em;
	}

	.kannada-section h2 {
		font-family: 'Noto Sans Kannada', serif;
		color: #1d4ed8;
		border-bottom-color: #e0e0e0;
	}

	.kannada-section p {
		font-family: 'Noto Sans Kannada', serif;
		font-size: 1.05em;
		line-height: 1.8;
	}

	.intro p,
	.philosophy p,
	.monkey-theorem p,
	.why-section p {
		text-align: justify;
		margin: 0 0 1em 0;
	}

	blockquote {
		margin: 1.5em 0;
		padding: 1em 1.5em;
		background: #fafafa;
		border-left: 3px solid #ccc;
		font-style: italic;
	}

	blockquote footer {
		margin-top: 0.5em;
		font-style: normal;
		font-size: 0.9em;
		color: #666;
		border-top: none;
		padding-top: 0;
		text-align: left;
	}

	.monkey-theorem {
		background: #fffbeb;
		border: 1px solid #fcd34d;
		padding: 1.5em;
		margin: 2em 0;
	}

	.monkey-theorem h2 {
		color: #b45309;
		border-bottom-color: #fcd34d;
	}

	.why-section {
		background: #f0fdf4;
		border: 1px solid #86efac;
		padding: 1.5em;
		margin: 2em 0;
	}

	.why-section h2 {
		color: #166534;
		border-bottom-color: #86efac;
	}

	.why-section h3 {
		color: #15803d;
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

	.links a {
		color: #000;
		text-decoration: none;
		border-bottom: 1px solid #ccc;
	}

	.links a:hover {
		border-bottom-color: #000;
	}

	footer {
		border-top: 1px solid #ccc;
		padding-top: 1.5em;
		margin-top: 3em;
		font-size: 0.9em;
		color: #666;
		text-align: center;
	}

	.made-by {
		margin-top: 1em;
	}

	.made-by p {
		margin: 0.25em 0;
	}

	.made-by strong {
		color: #333;
	}

	.made-by .links a {
		color: #1d4ed8;
		text-decoration: none;
		border-bottom: 1px solid #93c5fd;
	}

	.made-by .links a:hover {
		border-bottom-color: #1d4ed8;
	}

	.made-by .separator {
		margin: 0 0.75em;
		color: #ccc;
	}

	.return-link a {
		color: #666;
		text-decoration: none;
		border-bottom: 1px dotted #999;
	}

	.return-link a:hover {
		border-bottom-style: solid;
		color: #000;
	}

	@media (max-width: 768px) {
		.page {
			padding: 2em 1em;
		}

		h1 {
			font-size: 1.3em;
			word-wrap: break-word;
		}

		h2 {
			font-size: 1.15em;
		}

		h3 {
			font-size: 1em;
		}

		.kannada-section {
			padding: 1em;
		}

		.kannada-section p {
			font-size: 1em;
			text-align: left;
		}

		.intro p,
		.philosophy p,
		.monkey-theorem p,
		.why-section p {
			text-align: left;
		}

		.monkey-theorem,
		.why-section {
			padding: 1em;
		}

		blockquote {
			padding: 0.75em 1em;
			font-size: 0.95em;
		}

		.links li {
			padding-left: 1.25em;
		}
	}
</style>