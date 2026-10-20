# Architecture

Akshara-Mantapa is built as two separate systems: a Rust backend and a SvelteKit frontend. They communicate differently depending on the environment.

In development, the frontend talks to a local Axum HTTP server. In production, the entire backend is compiled to WebAssembly and runs directly in the browser. The frontend switches between these two modes automatically.

## Dual Runtime

```
Development:
  Browser -> HTTP -> Axum server (localhost:3000) -> Rust library

Production (GitHub Pages):
  Browser -> WASM module (in-browser) -> Rust library
```

The mode is detected in `frontend/src/lib/api.ts`:

```typescript
const USE_WASM = import.meta.env.PROD;
```

When `PROD` is true, all API calls are routed to a `WasmLibrary` instance loaded from the compiled `.wasm` binary. When false, they go to the local HTTP server. The interface on either side is identical, so the frontend code is the same in both modes.

## Project Layout

```
akshara-mantapa/
├── .github/
│   └── workflows/
│       └── deploy.yaml          # CI/CD pipeline for GitHub Pages
├── backend/                     # Rust crate (library + server + WASM)
│   ├── src/
│   │   ├── bin/
│   │   │   └── server.rs        # Axum HTTP server (dev only)
│   │   ├── engine/
│   │   │   ├── mod.rs           # GraphemeAlphabet trait + engine wiring
│   │   │   ├── alphabet.rs      # Grapheme cluster generation logic
│   │   │   ├── kannada.rs       # Kannada-specific alphabet (57,324 clusters)
│   │   │   └── telugu.rs        # Telugu alphabet (proof-of-concept)
│   │   ├── bijection.rs         # BijectionEngine trait + multiplicative inverse
│   │   ├── constants.rs         # Page/book/shelf/wall/room dimensions
│   │   ├── lib.rs               # Crate entry point and public exports
│   │   ├── library.rs           # LibraryOfBabel: search, generate, navigate
│   │   ├── types.rs             # HierarchicalAddress, Location, Page, SearchResult
│   │   └── wasm.rs              # WasmLibrary bindings (wasm feature only)
│   └── Cargo.toml
├── frontend/                    # SvelteKit app
│   ├── src/
│   │   ├── lib/
│   │   │   ├── api.ts           # Dual-mode API client (HTTP <-> WASM)
│   │   │   ├── index.ts         # Lib exports
│   │   │   └── wasm/            # Compiled WASM files (copied from backend/pkg)
│   │   └── routes/
│   │       ├── +layout.svelte   # Root layout (fonts, global styles)
│   │       ├── +layout.ts       # Prerender + SSR config
│   │       ├── +page.svelte     # Main library interface
│   │       ├── about/
│   │       │   └── +page.svelte # Philosophy and background
│   │       └── info/
│   │           └── +page.svelte # Technical documentation
│   ├── static/
│   │   ├── favicon.svg
│   │   ├── main-picture.png
│   │   └── robots.txt
│   ├── svelte.config.js
│   ├── vite.config.ts
│   └── package.json
└── README.md
```

## Backend Modules

### `engine/`

The engine directory contains the trait-based alphabet system. `GraphemeAlphabet` is the core trait, defining how grapheme clusters are generated and indexed. `kannada.rs` provides the production implementation with 57,324 clusters. `telugu.rs` is an additional implementation that demonstrates the architecture is script-agnostic.

To add a new Indic script, you implement `GraphemeAlphabet` for it. The rest of the library works unchanged.

### `bijection.rs`

Implements the `BijectionEngine` trait and the multiplicative inverse bijection used in production. The bijection maps page content as a large integer in base 57,324 to a unique address and back:

$$\text{address} = (\text{content\_num} \times C) \mod N$$

$$\text{content\_num} = (\text{address} \times I) \mod N$$

where:

$$N = 57324^{400} \quad \approx 10^{1899} \quad (\text{total possible pages, } \sim 6308 \text{ bits})$$

- $C$ is a coprime multiplier chosen such that $\gcd(C, N) = 1$
- $I = C^{-1} \mod N$ is the modular inverse of $C$, satisfying $C \cdot I \equiv 1 \pmod{N}$

$C$ and $I$ are computed using the Extended Euclidean Algorithm at initialization. This takes a few seconds on first startup and is the only expensive step in the system.

### `library.rs`

`LibraryOfBabel<A>` is the main entry point. It is generic over an alphabet type and exposes:

- `random_page()`: generates a page at a random address
- `generate_page(location)`: generates a page from a known address
- `search(text)`: converts text to its canonical address, where the text appears at the page start
- User-facing search calls `search_at_random_position(text)` so results contain the query within random page content instead of zero-index padding.
- `search_at_random_position(text)`: places text at a random offset within a page
- `next_page(location)` / `previous_page(location)`: address arithmetic
- `parse_address(string)`: parses either hex or hierarchical address strings
- `mandira_as_kannada(bigint)`: converts a room number to Kannada grapheme clusters

### `types.rs`

Defines the core data structures:

- `Location`: holds a raw hex address and its parsed `HierarchicalAddress`
- `HierarchicalAddress`: the five-part `mandira.gode.patti.pustaka.puta` breakdown
- `Page`: a location plus `content` (flat string) and `formatted_content` (line-broken)
- `SearchResult`: a location plus the original query

### `constants.rs`

All structural constants in one place:

```rust
CLUSTERS_PER_PAGE = 400
CLUSTERS_PER_LINE = 25
PAGES_PER_BOOK    = 410
BOOKS_PER_SHELF   = 32
SHELVES_PER_WALL  = 5
WALLS_PER_ROOM    = 4
```

### `wasm.rs`

The `WasmLibrary` struct exposes the Rust library to JavaScript via `wasm-bindgen`. It wraps `LibraryOfBabel<GraphemeAlphabet>` and serializes all responses as JSON strings. It is only compiled when the `wasm` feature is enabled.

Exposed methods:

| JS name | Description |
|---|---|
| `getPage(address)` | Page by address |
| `findText(text)` | Search, with text at start of page |
| `searchText(query)` | Search at random position |
| `browseRandom(count)` | One or more random pages |
| `next_page(address)` | Next page |
| `previous_page(address)` | Previous page |

### `bin/server.rs`

The Axum HTTP server. This binary is only compiled with the `server` feature and is never deployed to production. It exposes the same operations as `wasm.rs` over a REST API on `localhost:3000`.

## Frontend

### `api.ts`

The single file that makes the dual-runtime work. All other frontend code calls functions from `api.ts` and has no awareness of whether it is speaking to HTTP or WASM. Each function checks `USE_WASM` and dispatches accordingly.

### WASM Loading

The WASM module is loaded lazily as a singleton on first use:

```typescript
const wasm = await import('./wasm/akshara_mantapa.js');
await wasm.default();                   // loads the .wasm binary
wasmLibrary = new wasm.WasmLibrary();   // creates the library instance
```

Subsequent calls reuse the cached instance.

### SvelteKit Config

The app is fully prerendered and runs without a server (`ssr = false`, `prerender = true`). This allows deployment to GitHub Pages as a static site.

## Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| Core logic | Rust | Bijection engine, alphabet, page generation |
| Big integers | `num-bigint` | 6,308-bit arithmetic |
| HTTP server | Axum + Tokio | Local development API |
| WASM bindings | `wasm-bindgen` | Browser deployment |
| JSON | `serde` / `serde_json` | Serialization |
| Frontend | SvelteKit + TypeScript | UI and routing |
| Build tool | Vite | Dev server and bundling |
| Fonts | Noto Sans Kannada, Georgia | Script rendering |

## Crate Features

The backend uses Cargo features to separate concerns:

```toml
[features]
default = []
wasm   = ["wasm-bindgen", "serde-wasm-bindgen", "js-sys", "getrandom"]
server = ["axum", "tokio", "tower-http"]
```

Neither the server nor the WASM bindings are compiled by default. This keeps the library crate lean and prevents dependency conflicts between the two runtimes.

---

**Related pages:** [[Address Format]] · [[API Reference]] · [[Development Setup]] · [[Deployment]]
