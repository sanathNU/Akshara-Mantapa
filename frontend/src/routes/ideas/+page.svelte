<script>
	import { base } from '$app/paths';
</script>

<div class="page">
	<header>
		<h1>∞ Future Ideas</h1>
		<p class="subtitle">A hidden corner for brainstorming and planning</p>
		<nav class="breadcrumb">
			<a href="{base}/">← Back to Library</a>
		</nav>
	</header>

	<article>
		<section class="notice">
			<p>
				🔮 This is a hidden page for collecting future implementation ideas. 
				It's not linked from anywhere in the main navigation.
			</p>
		</section>

		<section>
			<h2>Performance & Infrastructure</h2>
			<ul>
				<li>
					<strong>Precompute Bijection Constants</strong> — Save C and I to files for instant startup 
					instead of computing on every server restart
				</li>
				<li>
					<strong>LRU Cache</strong> — Cache frequently accessed pages to reduce computation
				</li>
				<li>
					<strong>Mandira Caching</strong> — Cache Kannada mandira conversions for common addresses
				</li>
				<li>
					<strong>Rate Limiting</strong> — Protect API from abuse with sensible rate limits
				</li>
				<li>
					<strong>CDN Integration</strong> — Serve static assets from a CDN for faster global access
				</li>
			</ul>
		</section>

		<section>
			<h2>Features</h2>
			<ul>
				<li>
					<strong>Bookmarks</strong> — Let users save favorite pages or interesting locations locally
				</li>
				<li>
					<strong>Share Links</strong> — Generate shareable URLs for specific pages with previews
				</li>
				<li>
					<strong>Export Pages</strong> — Download pages as PDF, plain text, or images
				</li>
				<li>
					<strong>Dark Mode</strong> — Theme toggle for different lighting conditions
				</li>
				<li>
					<strong>Advanced Search</strong> — Regex or pattern-based search capabilities
				</li>
				<li>
					<strong>Search History</strong> — Remember recent searches for easy access
				</li>
				<li>
					<strong>Page Annotations</strong> — Allow users to add personal notes to pages
				</li>
				<li>
					<strong>Random Walk Mode</strong> — Automatically navigate through random pages like a screensaver
				</li>
			</ul>
		</section>

		<section>
			<h2>Multi-Script Support</h2>
			<ul>
				<li>
					<strong>Telugu</strong> — తెలుగు అక్షర మంటపం
				</li>
				<li>
					<strong>Tamil</strong> — தமிழ் அக்ஷர மண்டபம்
				</li>
				<li>
					<strong>Malayalam</strong> — മലയാളം അക്ഷര മണ്ഡപം
				</li>
				<li>
					<strong>Devanagari</strong> — For Hindi, Sanskrit, Marathi
				</li>
				<li>
					<strong>Bengali</strong> — বাংলা অক্ষর মন্টপ
				</li>
				<li>
					<strong>Script Comparison</strong> — Show the same "address" across different scripts
				</li>
			</ul>
		</section>

		<section>
			<h2>Visualization & Exploration</h2>
			<ul>
				<li>
					<strong>3D Library Visualization</strong> — Navigate hexagonal galleries like in Borges' description
				</li>
				<li>
					<strong>Address Space Map</strong> — Visual representation of where you are in the library
				</li>
				<li>
					<strong>Cluster Frequency Analysis</strong> — Show which grapheme clusters appear most in random pages
				</li>
				<li>
					<strong>Meaningful Text Finder</strong> — AI-assisted search for pages with coherent Kannada text
				</li>
				<li>
					<strong>Distance Calculator</strong> — Show "distance" between two pages in the address space
				</li>
			</ul>
		</section>

		<section>
			<h2>Educational</h2>
			<ul>
				<li>
					<strong>Interactive Tutorial</strong> — Step-by-step guide explaining the mathematics
				</li>
				<li>
					<strong>Grapheme Cluster Explorer</strong> — Visual tool to explore all 56,028 clusters
				</li>
				<li>
					<strong>Bijection Visualizer</strong> — Animated demonstration of the encoding/decoding process
				</li>
				<li>
					<strong>Probability Calculator</strong> — Calculate odds of finding meaningful text randomly
				</li>
			</ul>
		</section>

		<section>
			<h2>API & Integration</h2>
			<ul>
				<li>
					<strong>Public API</strong> — RESTful API for third-party integrations
				</li>
				<li>
					<strong>Browser Extension</strong> — Quickly search selected Kannada text in the library
				</li>
				<li>
					<strong>Mobile App</strong> — Native iOS/Android experience
				</li>
				<li>
					<strong>CLI Tool</strong> — Command-line interface for power users
				</li>
				<li>
					<strong>Webhook Notifications</strong> — Get notified when specific patterns are searched
				</li>
			</ul>
		</section>

		<section>
			<h2>Fun & Experimental</h2>
			<ul>
				<li>
					<strong>Daily Random Page</strong> — A "page of the day" feature
				</li>
				<li>
					<strong>Treasure Hunt</strong> — Hide messages and share addresses for others to find
				</li>
				<li>
					<strong>Poetry Generator</strong> — Find pages that happen to contain valid Kannada meter
				</li>
				<li>
					<strong>Collaborative Exploration</strong> — See what pages others are viewing in real-time
				</li>
				<li>
					<strong>NFT Integration</strong> — Mint unique pages as collectibles (just kidding... unless?)
				</li>
			</ul>
		</section>

		<section class="notes">
			<h2>Implementation Notes</h2>
			<p>
				Ideas marked with higher priority should focus on user experience improvements 
				and performance optimizations. Multi-script support would require significant 
				refactoring of the grapheme alphabet generation but would multiply the project's reach.
			</p>
			<p>
				The 3D visualization could use Three.js (already available in artifacts) to render 
				Borges' hexagonal galleries. This would be a significant undertaking but would create 
				a truly immersive experience.
			</p>
		</section>
	</article>

	<footer>
		<p>
			<em>"Every idea exists somewhere in the library—including the idea for this page."</em>
		</p>
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
		margin: 0 0 0.25em 0;
		line-height: 1.2;
	}

	.subtitle {
		font-size: 1em;
		margin: 0 0 0.75em 0;
		color: #666;
		font-style: italic;
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

	section {
		margin: 2em 0;
	}

	.notice {
		background: #fef3c7;
		border: 1px solid #f59e0b;
		padding: 1em 1.5em;
		border-radius: 4px;
	}

	.notice p {
		margin: 0;
	}

	ul {
		padding-left: 1.5em;
	}

	li {
		margin: 0.75em 0;
	}

	li strong {
		color: #1d4ed8;
	}

	.notes {
		background: #f8fafc;
		border: 1px solid #e2e8f0;
		padding: 1.5em;
		margin-top: 3em;
	}

	.notes h2 {
		margin-top: 0;
		color: #475569;
	}

	.notes p {
		margin: 0 0 1em 0;
		color: #64748b;
	}

	.notes p:last-child {
		margin-bottom: 0;
	}

	footer {
		border-top: 1px solid #ccc;
		padding-top: 1em;
		margin-top: 3em;
		font-size: 0.9em;
		color: #666;
		text-align: center;
	}

	@media (max-width: 768px) {
		.page {
			padding: 2em 1em;
		}

		h1 {
			font-size: 1.5em;
		}
	}
</style>