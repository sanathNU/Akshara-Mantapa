# Akshara-Mantapa

![Akshara Mantapa Banner](frontend/static/main-picture.png)

ಅಕ್ಷರ ಮಂಟಪ. A Library of Babel for Kannada.

An infinite library containing every possible page of Kannada text, inspired by Jorge Luis Borges' *The Library of Babel*. Every possible Kannada text of 400 grapheme clusters exists at exactly one address, and every address always produces the same page.

## What It Does

- Browse random pages from the library
- Search for any Kannada text and find its exact location
- Search again to place the same text at a different position
- Navigate directly to a known address
- Move between neighbouring pages
- View addresses in a Borges-inspired hierarchy of rooms, walls, shelves, books, and pages

## How It Works

Every page is mapped to a unique address using multiplicative inverse modular arithmetic over a 6,308-bit integer space. The alphabet consists of 57,324 Kannada grapheme clusters. The mapping is fully invertible: text can be converted to an address, and any address can be converted back to text, with no storage required.

$$a = (p \times C) \mod N \qquad p = (a \times I) \mod N$$

where $p$ is the page content as a base-57,324 integer, $a$ is the address, $N = 57324^{400}$, and $I = C^{-1} \bmod N$.

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
- Unicode Consortium for Kannada character standardisation

---

*Every possible Kannada text, including this document, exists somewhere in the library.*