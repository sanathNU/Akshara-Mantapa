<script lang="ts">
	import DocPage from '$lib/components/DocPage.svelte';
	import { base } from '$app/paths';

	let lang = $state<'kn' | 'en'>('kn');
	const kannada = $derived(lang === 'kn');
</script>

<svelte:head>
	<title>{kannada ? 'ಪರಿಚಯ' : 'About'} · Akshara Mantapa</title>
</svelte:head>

<DocPage
	label={kannada ? 'ಪರಿಚಯ' : 'About'}
	labelLang={kannada ? 'kn' : undefined}
	title={kannada ? 'ಅಕ್ಷರ ಮಂಟಪ' : 'Akshara-Mantapa: A Library of Babel for Kannada'}
	titleLang={kannada ? 'kn' : undefined}
	backText={kannada ? 'ಗ್ರಂಥಾಲಯಕ್ಕೆ ಹಿಂತಿರುಗಿ' : 'Back to the library'}
	madeByText={kannada ? 'ರಚಿಸಿದವರು' : 'Made by'}
	websiteText={kannada ? 'ವೆಬ್‌ಸೈಟ್' : 'Website'}
	uiLang={kannada ? 'kn' : undefined}
>
	{#snippet controls()}
		<nav class="switch" aria-label="Language">
			<button type="button" class:on={kannada} lang="kn" aria-pressed={kannada} onclick={() => (lang = 'kn')}>ಕನ್ನಡ</button>
			<span class="sep" aria-hidden="true">·</span>
			<button type="button" class:on={!kannada} aria-pressed={!kannada} onclick={() => (lang = 'en')}>English</button>
		</nav>
	{/snippet}

	<article {lang}>
		{#if lang === 'kn'}
			<!-- Kannada Content -->
			<section class="intro kannada-section">
				<p class="origin-note">
					ಈ ಪುಟದ ಮೂಲ ಭಾಷೆ ಕನ್ನಡ. ಅಕ್ಷರ ಮಂಟಪ ಕನ್ನಡದಲ್ಲೇ ಆರಂಭವಾಯಿತು; ಆದ್ದರಿಂದ ಕನ್ನಡ ಆವೃತ್ತಿಯೇ ಇದರ ಮೂಲರೂಪ. ಇಂಗ್ಲಿಷ್ ವಿಭಾಗವು ಅದರ ಅನುವಾದ.
				</p>
				<p>
					ಜಾರ್ಜ್ ಲೂಯಿಸ್ ಬೋರ್ಗೆಸ್ ಅವರ ೧೯೪೧ ರ ಕಿರು ಕಥೆ "ದಿ ಲೈಬ್ರರಿ ಆಫ್ ಬ್ಯಾಬೆಲ್" ನಿಂದ ಸ್ಫೂರ್ತಿ ಪಡೆದ ಈ ಯೋಜನೆಯು
					ಅನಂತ ಮತ್ತು ನಿರ್ಧಾರಿತ ಗ್ರಂಥಾಲಯದ ಪರಿಕಲ್ಪನೆಯನ್ನು ಕನ್ನಡ ಭಾಷೆಗೆ ತರುತ್ತದೆ.
				</p>
				<p>
					ಈ ಗ್ರಂಥಾಲಯವು ೪೦೦ ಅಕ್ಷರಗುಚ್ಛಗಳ ಪ್ರತಿಯೊಂದು ಸಂಭವನೀಯ ಕನ್ನಡ ಪಠ್ಯವನ್ನು ಒಳಗೊಂಡಿದೆ.
					ಏಕೈಕ, ಸುಂದರವಾದ ದ್ವಿಮುಖ ಮ್ಯಾಪಿಂಗ್ ಮೂಲಕ, ಪ್ರತಿಯೊಂದು ಪಠ್ಯವು ನಿಖರವಾಗಿ ಒಂದು ವಿಳಾಸವನ್ನು ಹೊಂದಿದೆ.
					ಯಾವುದೇ ಕನ್ನಡ ಪಠ್ಯಕ್ಕಾಗಿ ಹುಡುಕಿ, ಮತ್ತು ಗ್ರಂಥಾಲಯವು ಅದರ ನಿಖರವಾದ ಸ್ಥಳವನ್ನು ತೋರಿಸುತ್ತದೆ.
				</p>
				<p>
					೫೭,೩೨೪ ಅಕ್ಷರ ಗುಚ್ಛಗಳೊಂದಿಗೆ, ಈ ಗ್ರಂಥಾಲಯವು ೫೭,೩೨೪<sup>೪೦೦</sup> ≈ ೧೦<sup>೧,೯೦೩</sup> ಸಂಭವನೀಯ ಪುಟಗಳನ್ನು ಒಳಗೊಂಡಿದೆ.
					ಈ ಸಂಖ್ಯೆಯು <a href="https://en.wikipedia.org/wiki/Graham%27s_number" target="_blank" rel="noopener">ಗ್ರಾಹಮ್ ಸಂಖ್ಯೆ</a>ಯಂತಹ ರಚನೆಗಳಿಗಿಂತ ಚಿಕ್ಕದಾಗಿದ್ದರೂ, ಅಗ್ರಾಹ್ಯವಾಗಿ ವಿಶಾಲವಾಗಿದೆ.
					ಆದರೂ ಪ್ರತಿಯೊಂದು ಪುಟವೂ ತಕ್ಷಣವೇ ಪ್ರವೇಶಿಸಬಹುದು ಮತ್ತು ಹುಡುಕಬಹುದು.
				</p>
			</section>

			<section class="philosophy kannada-section">
				<h2>ಮೂಲ ದೃಷ್ಟಿಕೋನ</h2>
				<blockquote>
					"ವಿಶ್ವವು (ಇತರರು ಗ್ರಂಥಾಲಯ ಎಂದು ಕರೆಯುತ್ತಾರೆ) ಅನಿರ್ದಿಷ್ಟ ಮತ್ತು ಬಹುಶಃ ಅನಂತ ಸಂಖ್ಯೆಯ ಷಡ್ಭುಜಾಕಾರದ 
					ಗ್ಯಾಲರಿಗಳಿಂದ ಕೂಡಿದೆ, ಅವುಗಳ ನಡುವೆ ವಿಶಾಲ ಗಾಳಿ ಕೊಳವೆಗಳಿವೆ, ಬಹಳ ತಗ್ಗು ಕೈಪಿಡಿಗಳಿಂದ ಸುತ್ತುವರಿದಿದೆ."
					<footer>— ಜಾರ್ಜ್ ಲೂಯಿಸ್ ಬೋರ್ಗೆಸ್, "ದಿ ಲೈಬ್ರರಿ ಆಫ್ ಬ್ಯಾಬೆಲ್"</footer>
				</blockquote>
				<p>
					ಬೋರ್ಗೆಸ್ ೪೧೦ ಪುಟಗಳ ಪ್ರತಿಯೊಂದು ಸಂಭವನೀಯ ಪುಸ್ತಕವನ್ನು ಒಳಗೊಂಡ ಗ್ರಂಥಾಲಯವನ್ನು ಕಲ್ಪಿಸಿಕೊಂಡರು.
					ಅಕ್ಷರ ಮಂಟಪವು ೪೦೦-ಗುಚ್ಛ ಪುಟಗಳು ಮತ್ತು ೪೧೦ ಪುಟಗಳ ಪುಸ್ತಕಗಳೊಂದಿಗೆ ಈ ರಚನೆಯನ್ನು ನಿಷ್ಠೆಯಿಂದ ಸಂರಕ್ಷಿಸುತ್ತದೆ, ಆದರೆ ಸೀಮಿತ
					ಲ್ಯಾಟಿನ್ ವರ್ಣಮಾಲೆಯ ಬದಲು ಕನ್ನಡದ ೫೭,೩೨೪ ಅಕ್ಷರ ಗುಚ್ಛಗಳನ್ನು ಬಳಸುತ್ತದೆ.
				</p>
			</section>

			<section class="why-section kannada-section">
				<h2>ಇದನ್ನು ಏಕೆ ನಿರ್ಮಿಸಬೇಕು?</h2>
				<blockquote class="basavanna-quote">
					ಕನ್ನಡ ನನ್ನ ಮಾತೃಭಾಷೆ. ಇದು ಸಾಕೆಂದು ನಾನು ಭಾವಿಸುವೆ.
				</blockquote>
			</section>

			<section class="links kannada-section">
				<h2>ಇನ್ನಷ್ಟು ತಿಳಿಯಿರಿ</h2>
				<ul>
					<li>
						<a href="{base}/info">ತಾಂತ್ರಿಕ ದಾಖಲೀಕರಣ | Technical Documentation</a>
					</li>
					<li>
						<a href="https://en.wikipedia.org/wiki/The_Library_of_Babel" target="_blank" rel="noopener">
							ಮೂಲ ಕಥೆ
						</a> — ಬೋರ್ಗೆಸ್‌ನ ಕಿರು ಕಥೆಯನ್ನು ಓದಿ
					</li>
					<li>
						<a href="https://libraryofbabel.info" target="_blank" rel="noopener">
							ಮೂಲ ಅನುಷ್ಠಾನ
						</a> — ಜೊನಾಥನ್ ಬಾಸಿಲ್ ಅವರ ಇಂಗ್ಲಿಷ್ ಆವೃತ್ತಿ
					</li>
					<li>
						<a href="https://youtu.be/GDrBIKOR01c?t=1032" target="_blank" rel="noopener">
							Vsauce ವಿವರಣೆ
						</a> — ಮೈಕೆಲ್ ಸ್ಟೀವನ್ಸ್ ಲೈಬ್ರರಿ ಆಫ್ ಬ್ಯಾಬೆಲ್ ಮತ್ತು ಅನಂತತೆಯನ್ನು ಅನ್ವೇಷಿಸುತ್ತಾರೆ
					</li>
					<li>
						<a href="https://en.wikipedia.org/wiki/Infinite_monkey_theorem" target="_blank" rel="noopener">
							ಅನಂತ ಕೋತಿ ಪ್ರಮೇಯ
						</a> — ಸಂಭವನೀಯತಾ ಚಿಂತನೆಯ ಪ್ರಯೋಗ
					</li>
				</ul>
			</section>
		{:else}
			<!-- English Content -->
			<section class="intro">
				<p class="origin-note">
					Kannada is the original language of this page. Akshara-Mantapa began as a Kannada library, so the Kannada version is its most original expression; this English section is a translation.
				</p>
				<p>
					Inspired by Jorge Luis Borges' 1941 short story "The Library of Babel," Akshara-Mantapa
					brings the concept of an infinite, deterministic library to the Kannada language.
				</p>
				<p>
					The library contains every possible combination of 400-cluster Kannada text. Through an
					algorithmic bijective mapping, each text has exactly one address, and each address 
					generates exactly one page. The system is fully invertible: search for any text and 
					find its unique location; browse any address and deterministically generate its content.
				</p>
				<p>
					With 57,324 grapheme clusters (including consonants, vowels, matras, modifiers, and conjuncts),
					the library contains 57,324<sup>400</sup> ≈ 10<sup>1,903</sup> possible pages. This number,
					while still dwarfed by constructs like <a href="https://en.wikipedia.org/wiki/Graham%27s_number" target="_blank" rel="noopener">Graham's number</a>, is incomprehensibly vast. Yet every 
					page is instantly accessible and searchable.
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
					per page and 80 characters per line. Jonathan Basile's <a href="https://libraryofbabel.info" target="_blank" rel="noopener">libraryofbabel.info</a> 
					brilliantly realized this vision for English with 3,200 characters per page drawn from a 29-character alphabet.
				</p>
				<p>
					Akshara-Mantapa keeps the 410-page books, with 400 clusters (16 lines of 25) on every page, but uses
					Kannada's 57,324 grapheme clusters instead of the limited Latin alphabet. Each cluster 
					represents roughly 10<sup>3</sup> times more possibilities than a single Latin character, 
					creating a space incomparably vaster yet equally navigable.
				</p>
				<p>
					The hierarchical addressing mirrors Borges' physical structure: mandira (room), gode (wall),
					patti (shelf), pustaka (book), and puta (page). This approach is similar to Basile's 
					implementation and faithful to Borges' original encoding, though the larger alphabet 
					results in longer hexadecimal addresses.
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
				<blockquote class="basavanna-quote">
					<span lang="kn">ಅರಿವೇ ಗುರು</span><br/>
					<span class="translation">(Awareness itself is the teacher)</span>
					<footer>— Basavanna</footer>
				</blockquote>
				<p>
					This transforms a probabilistic thought experiment into a navigable reality. Every Kannada 
					poem ever written, every poem that could be written, every nonsensical string of characters, 
					all exist simultaneously, waiting to be discovered.
				</p>
			</section>

			<section class="why-section">
				<h2>Why Build This?</h2>
				
				<h3><span lang="kn">ಕನ್ನಡ</span>, My Mother Tongue</h3>
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
					over 57,324 such clusters, ensuring mathematical correctness with around 6,300-bit arithmetic, and 
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
		{/if}
	</article>
</DocPage>
