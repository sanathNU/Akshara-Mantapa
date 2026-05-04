# Akshara-Mantapa

![Akshara Mantapa Banner](frontend/static/main-picture.png)

ಅಕ್ಷರ ಮಂಟಪ. A Kannada-first Library of Babel for Indic scripts.

An infinite library containing every possible page of Kannada, Telugu, and Tamil text, inspired by Jorge Luis Borges' *The Library of Babel*. Every possible 400-grapheme-cluster page exists at exactly one address within its selected script, and every address always produces the same page.

## What It Does

- Browse random pages from the library
- Search for text in Kannada, Telugu, or Tamil and find its exact location
- Search again to place the same text at a different position
- Navigate directly to a known address
- Move between neighbouring pages
- View addresses in a Borges-inspired hierarchy of rooms, walls, shelves, books, and pages
- Hot-switch between supported Indic scripts from the frontend without restarting the backend

## How It Works

Every page is mapped to a unique address using multiplicative inverse modular arithmetic over a script-specific integer space. The engine is built around a generic Brahmic script abstraction; Kannada, Telugu, and Tamil each provide their own Unicode ranges, consonants, vowels, matras, modifiers, virama, punctuation, and generated grapheme alphabet.

$$a = (p \times C) \mod N \qquad p = (a \times I) \mod N$$

where $p$ is the page content as a base-$alphabet\_size$ integer, $a$ is the address, $N = alphabet\_size^{400}$, and $I = C^{-1} \bmod N$.

| Script | Selector | Notes |
|---|---|---|
| Kannada | `kannada` | Default/main experience, 57,324 grapheme clusters |
| Telugu | `telugu` | Telugu script engine with a Kannada-like cluster space |
| Tamil | `tamil` | Tamil script engine with 20,466 grapheme clusters, including common Grantha letters |

## Engine Hot-Switching

In development, the Axum backend keeps one `LibraryOfBabel` engine per supported script in shared app state. HTTP requests default to Kannada and can select another engine with `script=kannada`, `script=telugu`, or `script=tamil`.

In production, the frontend uses the same model with WebAssembly: it caches one `WasmLibrary` instance per selected script and swaps between them when the language button changes.

## Tech Stack

Rust backend (Axum in development, WebAssembly in production) and SvelteKit frontend, deployed as a static site on GitHub Pages.

## Quick Start

```bash
# Backend (development server)
cd backend
cargo run --bin server --features server --release

# Frontend
cd frontend
npm install && npm run dev
```

Full setup instructions, including WASM builds and deployment, are in the [wiki](https://github.com/sanathNU/Akshara-Mantapa/wiki).

## API Script Selection

Library endpoints accept an optional `script` query parameter:

```text
GET /api/random?script=tamil
GET /api/search?script=telugu&q=తెలుగు
GET /api/page?script=kannada&address=<address>
```

If `script` is omitted, Kannada is used.

## Blog Series

For the full story of how this was built, from the philosophical motivations to the mathematical and engineering details, start with the [blog series](https://sanathnu.github.io/blog/web/Ananta-Intro.html).

## Documentation

The project wiki covers everything in detail:

| Page | Description |
|---|---|
| [Architecture](https://github.com/sanathNU/Akshara-Mantapa/wiki/Architecture) | Dual-runtime design, module breakdown, tech stack |
| [Address Format](https://github.com/sanathNU/Akshara-Mantapa/wiki/Address-Format) | Raw hex and hierarchical address systems |
| [API Reference](https://github.com/sanathNU/Akshara-Mantapa/wiki/API-Reference) | HTTP endpoints and WASM methods |
| [Development Setup](https://github.com/sanathNU/Akshara-Mantapa/wiki/Development-Setup) | Running locally |
| [Deployment](https://github.com/sanathNU/Akshara-Mantapa/wiki/Deployment) | GitHub Actions pipeline and Pages config |
| [Kannada Text Handling](https://github.com/sanathNU/Akshara-Mantapa/wiki/Kannada-Text-Handling) | Grapheme cluster alphabet |
| [Project Concept](https://github.com/sanathNU/Akshara-Mantapa/wiki/Project-Concept) | Borges inspiration and philosophy |

## Acknowledgments

- Jorge Luis Borges for the original concept
- Jonathan Basile for [libraryofbabel.info](https://libraryofbabel.info)
- The Rust and SvelteKit communities
- Unicode Consortium for Indic script standardisation

---

*Every possible Kannada, Telugu, and Tamil page exists somewhere in the library.*
