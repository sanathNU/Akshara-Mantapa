# Akshara-Mantapa

![Akshara Mantapa Banner](frontend/static/main-picture.png)

ಅಕ್ಷರ ಮಂಟಪ. A Library of Babel for Kannada.

An infinite library containing all possible combinations of Kannada text, inspired by Jorge Luis Borges' short story "The Library of Babel".

## Concept

This project implements a digital version of the Library of Babel for the Kannada language using a **single, elegant bijective mapping**. Every possible Kannada text of 400 clusters exists at exactly one address, and every address generates exactly one page. The system is fully invertible—you can search for any text and find its unique location, and every location deterministically generates its content.

## Features

- **Browse Random Pages**: Explore random pages from the infinite library
- **Search for Text**: Find the exact location of any Kannada text instantly (highlighted in blue)
- **Find Again**: Search for text at random positions within pages (highlighted in yellow)
- **Navigate by Address**: Jump to any page using hierarchical or hex addresses
- **Page Navigation**: Browse through pages with Previous/Next buttons with smooth transitions
- **Hierarchical Display**: Addresses shown as `mandira.gode.patti.pustaka.puta` (Room.Wall.Shelf.Book.Page)
- **Mandira as Kannada**: Room identifiers displayed in Kannada script for smaller addresses
- **Bijective Mapping**: Single invertible system using multiplicative inverse modular arithmetic
- **Rich Kannada Script**: Uses **57,324 grapheme clusters** including:
  - Consonants, vowels, and their combinations
  - Matras (vowel signs) and modifiers (ಂ, ಃ)
  - Conjuncts (consonant clusters like ಕ್ಷ)
  - Punctuation and spaces
- **Minimalistic Design**: Clean, scholarly aesthetic with serif typography
- **Dual Mode**: HTTP API for development, WASM for production (GitHub Pages)

## The Mathematics

### Bijection Formula

Every page's content is mapped to a unique address using:

```
content_num = Σ (cluster_index[i] × 57324^i) for i in 0..400
address = (content_num × C) mod N
content_num = (address × I) mod N

Where:
- N = 57324^400 (modulus, the total number of possible pages)
- C = coprime multiplier
- I = C^(-1) mod N (modular inverse of C)
```

This creates a perfect one-to-one mapping between content and addresses.

### Constants (Borges-Faithful)

```
ALPHABET_SIZE     = 57,324 grapheme clusters
CLUSTERS_PER_PAGE = 400
PAGES_PER_BOOK    = 410
BOOKS_PER_SHELF   = 32
SHELVES_PER_WALL  = 5
WALLS_PER_ROOM    = 4
```

### Address Space

```
Total pages    = 57,324^400 ≈ 10^1,900
Address bits   ≈ 6,326 bits (~790 bytes, ~1,580 hex chars)
```

## Address Format

### Raw Hex Address
```
93cebf0ea1c7096fe3de06fd119faec4c4d549bda55708577c... (~1,580 chars)
```

### Hierarchical Display
```
Format: mandira.gode.patti.pustaka.puta
Example: 24ea75265...849e4ebd.4.4.23.325

Components:
- mandira (ಮಂದಿರ): Room identifier in hex (~1,560 chars)
- gode (ಗೋಡೆ): Wall number (1-4)
- patti (ಪಟ್ಟಿ): Shelf number (1-5)
- pustaka (ಪುಸ್ತಕ): Book number (1-32)
- puta (ಪುಟ): Page number (1-410)
```

### Mandira as Kannada
For smaller addresses (< 10,000 bits), the mandira (room name) is displayed as Kannada grapheme clusters:
```
ಕವಿರಾಜಮಾರ್ಗದಲ್ಲಿಯೇಕನ್ನಡನಾಡಿನ...
```

## Tech Stack

### Backend
- **Rust** - High-performance, memory-safe systems programming
- **Axum** - Modern async web framework
- **num-bigint** - Arbitrary precision arithmetic for 6,308-bit numbers
- **num-integer** - Integer operations (GCD, division with remainder)
- **Serde** - JSON serialization
- **Tower-HTTP** - CORS and middleware
- **wasm-bindgen** - WASM bindings for browser deployment

### Frontend
- **SvelteKit** - Modern, reactive UI framework
- **TypeScript** - Type-safe development
- **Vite** - Lightning-fast dev server
- **Noto Sans Kannada** - Proper Kannada font rendering

## Project Structure

```
Akshara-Mantapa/
├── .github/
│   └── workflows/
│       └── deploy.yaml          # GitHub Pages deployment
├── backend/                     # Rust backend
│   ├── src/
│   │   ├── bin/
│   │   │   └── server.rs        # Axum HTTP server binary
│   │   ├── alphabet.rs          # Kannada grapheme cluster generation
│   │   ├── bijection.rs         # Bijective mapping (C, I, mod arithmetic)
│   │   ├── constants.rs         # Library constants (page size, etc.)
│   │   ├── lib.rs               # Library entry point
│   │   ├── library.rs           # Page generation and search
│   │   ├── types.rs             # Data structures (Address, Page, etc.)
│   │   └── wasm.rs              # WASM bindings for browser
│   ├── Cargo.lock
│   └── Cargo.toml
├── frontend/                    # SvelteKit frontend
│   ├── src/
│   │   ├── lib/
│   │   │   ├── wasm/            # Compiled WASM files (for production)
│   │   │   ├── api.ts           # API client / WASM wrapper
│   │   │   └── index.ts         # Lib exports
│   │   └── routes/
│   │       ├── about/
│   │       │   └── +page.svelte # About page
│   │       ├── info/
│   │       │   └── +page.svelte # Technical documentation
│   │       ├── +layout.svelte   # Root layout with fonts
│   │       ├── +layout.ts       # Layout config (prerender, ssr)
│   │       └── +page.svelte     # Main page
│   ├── static/
│   │   ├── favicon.svg          # Site favicon
│   │   ├── main-picture.png     # Banner image
│   │   └── robots.txt
│   ├── app.html
│   ├── svelte.config.js
│   ├── vite.config.ts
│   └── package.json
└── README.md
```

## Setup and Installation

### Prerequisites

- **Rust** (1.70+): Install from [rustup.rs](https://rustup.rs)
- **Node.js** (18+): Install from [nodejs.org](https://nodejs.org)
- **wasm-pack**: Install with `cargo install wasm-pack`

### Development Mode (HTTP API)

#### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Build and run the server:
   ```bash
   cargo run --bin server --release
   ```

   The backend will start on `http://127.0.0.1:3000`

   First startup takes a few seconds to compute the bijection constants (C and I).

#### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

   The frontend will start on `http://localhost:5173`

### Production Mode (WASM)

For static deployment (e.g., GitHub Pages), the frontend uses WASM instead of HTTP API.

1. Build WASM:
   ```bash
   cd backend
   wasm-pack build --target web --features wasm
   ```

2. Copy WASM files to frontend:
   ```bash
   cp -r pkg/* ../frontend/src/lib/wasm/
   ```

3. Build frontend:
   ```bash
   cd frontend
   npm run build
   ```

4. The `build/` folder can be deployed to any static host.

## API Endpoints

The backend exposes the following REST API:

### `GET /`
Health check endpoint.

### `GET /api/info`
Returns library statistics.

### `GET /api/random`
Generates a random page from the library.

### `GET /api/page?address=<address>`
Retrieves a page by address (accepts both hex and hierarchical format).

### `GET /api/page-next?address=<address>`
Gets the next page after the given address.

### `GET /api/page-previous?address=<address>`
Gets the previous page before the given address (returns 404 if at first page).

### `GET /api/search?q=<kannada_text>`
Finds the exact location of any Kannada text (text appears at start of page).

### `GET /api/search-random?q=<text>`
Finds text at a random position within a page.

### `GET /api/verify?address=<addr>&text=<text>`
Verifies that a text appears at the given address.

## How It Works

### Bijective Mapping

The system uses **multiplicative inverse modular arithmetic** to create a perfect bijection:

1. **Search (Text → Address)**:
   - Take input text: `"ಕನ್ನಡ"`
   - Segment into grapheme clusters: `["ಕ", "ನ್", "ನ", "ಡ"]`
   - Convert each cluster to its alphabet index
   - Pad to 400 clusters with spaces (index 0)
   - Treat as base-57,324 number: `content_num = Σ (index[i] × 56028^i)`
   - Apply bijection: `address = (content_num × C) mod N`
   - Convert to hex and hierarchical format

2. **Browse (Address → Text)**:
   - Take hex address
   - Apply inverse: `content_num = (address × I) mod N`
   - Convert back to base-57,324 indices
   - Map indices to grapheme clusters
   - Format as 25 clusters per line

### Dev vs Production Mode

The frontend automatically detects its environment:

```typescript
const USE_WASM = import.meta.env.PROD;
```

- **Development**: Uses HTTP fetch to `localhost:3000` backend
- **Production**: Loads WASM module directly in browser

### Kannada Character Set

The alphabet systematically generates all valid Kannada grapheme clusters:
- Punctuation and spaces
- Independent vowels with optional modifiers
- Simple consonants
- Consonants with matras and modifiers
- Dead consonants (with halant)
- Two-consonant conjuncts with all combinations

This produces exactly **57,324unique clusters**.

### Page Specifications

- **Clusters per page**: 400
- **Formatted display**: 25 clusters per line, 16 lines

## Design Philosophy

The interface follows a minimalistic, scholarly aesthetic:
- Serif typography (Georgia) for body text
- Monospace fonts (Courier) for technical details
- High contrast (black on white)
- Generous whitespace
- Clean borders and subtle separators
- Smooth page transitions with loading indicators
- Emphasis on readability and content
- Kannada-first design with proper font rendering

## Performance Characteristics

- **Text Generation**: O(n²) where n ≈ 6,300 bits - Very fast!
- **Search**: O(n²) - Instant for any query
- **Address Parsing**: O(n) - Efficient
- **No Database**: Everything is deterministic and computed on-demand
- **First Startup**: ~5 seconds to compute bijection constants
- **Subsequent Requests**: Milliseconds

## Future Enhancements

1. **Precompute Constants** - Save C and I to files for instant startup
2. **Mandira Caching** - Cache Kannada mandira conversions
3. **Rate Limiting** - Protect API from abuse
4. **LRU Cache** - Cache frequently accessed pages
5. **Multiple Scripts** - Support for other Indic scripts (Telugu, Tamil, Malayalam)
6. **Advanced Search** - Regex or pattern-based search

## Philosophy

> "The universe (which others call the Library) is composed of an indefinite
> and perhaps infinite number of hexagonal galleries..."
>
> — Jorge Luis Borges, "The Library of Babel"

This implementation proves that with deterministic algorithms and elegant mathematics, we can create an infinite, reproducible space where every possible text exists at a definite, calculable location.

The use of Kannada script with 57,324 grapheme clusters creates a vastly larger space than the original (29^3200 vs 56028^400), yet remains fully navigable through the bijective mapping.

**Every possible Kannada text—including this very document—exists somewhere in the library.**

## License

This project is open source and available for educational and non-commercial use.

## Acknowledgments

- Jorge Luis Borges for the original concept
- Jonathan Basile for [libraryofbabel.info](https://libraryofbabel.info)
- The Rust and SvelteKit communities
- Unicode Consortium for Kannada character standardization
- Gwern Branwen for design inspiration