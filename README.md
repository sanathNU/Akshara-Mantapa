# Akshara-Mantapa
ಅಕ್ಷರ ಮಂಟಪ. A Library of Babel for Kannada.

An infinite library containing all possible combinations of Kannada text, inspired by Jorge Luis Borges' short story "The Library of Babel".

## Concept

This project implements a digital version of the Library of Babel for the Kannada language using a **single, elegant bijective mapping**. Every possible Kannada text of 400 clusters exists at exactly one address, and every address generates exactly one page. The system is fully invertible—you can search for any text and find its unique location, and every location deterministically generates its content.

## Features

- **Browse Random Pages**: Explore random pages from the infinite library
- **Search for Text**: Find the exact location of any Kannada text instantly
- **Navigate by Address**: Jump to any page using hierarchical or hex addresses
- **Hierarchical Display**: Addresses shown as `mandira.gode.patti.pustaka.puta` (Room.Wall.Shelf.Book.Page)
- **Bijective Mapping**: Single invertible system using multiplicative inverse modular arithmetic
- **Rich Kannada Script**: Uses **56,028 grapheme clusters** including:
  - Consonants, vowels, and their combinations
  - Matras (vowel signs) and modifiers (ಂ, ಃ)
  - Conjuncts (consonant clusters like ಕ್ಷ)
  - Punctuation and spaces
- **Minimalistic Design**: Clean, scholarly aesthetic with serif typography
- **Search Highlighting**: Found text is highlighted in yellow when viewing pages
- **Random Position Search**: Find text at random positions within pages

## The Mathematics

### Bijection Formula

Every page's content is mapped to a unique address using:

```
content_num = Σ (cluster_index[i] × 56028^i) for i in 0..400
address = (content_num × C) mod N
content_num = (address × I) mod N

Where:
- N = 56028^400 (modulus, the total number of possible pages)
- C = coprime multiplier
- I = C^(-1) mod N (modular inverse of C)
```

This creates a perfect one-to-one mapping between content and addresses.

### Constants (Borges-Faithful)

```
ALPHABET_SIZE     = 56,028 grapheme clusters
CLUSTERS_PER_PAGE = 400
PAGES_PER_BOOK    = 410
BOOKS_PER_SHELF   = 32
SHELVES_PER_WALL  = 5
WALLS_PER_ROOM    = 4
```

### Address Space

```
Total pages    = 56,028^400 ≈ 10^1,899
Address bits   ≈ 6,308 bits (~789 bytes, ~1,578 hex chars)
```

## Address Format

### Raw Hex Address
```
93cebf0ea1c7096fe3de06fd119faec4c4d549bda55708577c... (~1,578 chars)
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
The mandira (room name) can be displayed as ~399 Kannada grapheme clusters:
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
│   │   │   ├── assets/
│   │   │   │   ├── favicon.svg
│   │   │   │   └── favicon2.svg
│   │   │   ├── api.ts           # API client / WASM wrapper
│   │   │   └── index.ts         # Lib exports
│   │   └── routes/
│   │       ├── about/
│   │       │   └── +page.svelte # About page
│   │       ├── info/
│   │       │   └── +page.svelte # Technical documentation
│   │       ├── +layout.svelte   # Root layout with fonts
│   │       ├── +layout.ts       # Layout config
│   │       └── +page.svelte     # Main page
│   ├── static/
│   │   ├── main-picture.png
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
- **npm** or **pnpm**: Comes with Node.js

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Build and run the backend:
   ```bash
   cargo run --release
   ```

   The backend will start on `http://127.0.0.1:3000`

   First startup takes a few seconds to compute the bijection constants (C and I).

### Frontend Setup

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

4. Open your browser and visit `http://localhost:5173`

## API Endpoints

The backend exposes the following REST API:

### `GET /`
Health check endpoint.

**Response:**
```json
{
  "status": "ok",
  "message": "ಕನ್ನಡ Library of Babel API (Bijective)",
  "alphabet_size": 56028,
  "page_length": 400
}
```

### `GET /api/info`
Returns library statistics.

**Response:**
```json
{
  "alphabet_size": 56028,
  "clusters_per_page": 400,
  "pages_per_book": 410,
  "books_per_shelf": 32,
  "shelves_per_wall": 5,
  "walls_per_room": 4,
  "total_pages": "56028^400 ≈ 10^1899",
  "address_bits": 6308
}
```

### `GET /api/random`
Generates a random page from the library.

**Response:**
```json
{
  "raw_address": "16e24352a3f3e31a...",
  "hierarchical": {
    "mandira_hex": "5b7230be6037...",
    "mandira_kannada": "ಖ್ಟೂಃಞ್ಞನ್ಥೃಃ...",
    "gode": 1,
    "patti": 4,
    "pustaka": 29,
    "puta": 289
  },
  "content": "ಖ್ಟೂಃಞ್ಞನ್ಥೃಃ...",
  "formatted_content": "..."
}
```

### `GET /api/search?q=<kannada_text>`
Finds the exact location of any Kannada text.

**Query Parameters:**
- `q` (string): Kannada text to search for

**Response:**
```json
{
  "query": "ಕನ್ನಡ",
  "found": true,
  "location": {
    "raw_address": "93cebf0ea1c7096f...",
    "hierarchical": { /* hierarchical address */ }
  },
  "page_preview": "ಕನ್ನಡ                    ..."
}
```

### `GET /api/search-random?q=<text>`
Finds text at a random position within a page (for queries < 400 clusters).

**Response:** Same structure as `/api/search`

### `GET /api/page?address=<address>`
Retrieves a page by address (accepts both hex and hierarchical format).

**Query Parameters:**
- `address` (string): Either raw hex or hierarchical format

**Examples:**
```
/api/page?address=93cebf0ea1c7096fe3de...
/api/page?address=24ea75265eda0bd902b6.4.4.23.325
```

### `GET /api/verify?address=<addr>&text=<text>`
Verifies that a text appears at the given address (proves bijectivity).

**Response:**
```json
{
  "verified": true,
  "address": "...",
  "expected_text": "ಕನ್ನಡ",
  "actual_start": "ಕನ್ನಡ"
}
```

## How It Works

### Bijective Mapping

The system uses **multiplicative inverse modular arithmetic** to create a perfect bijection:

1. **Search (Text → Address)**:
   - Take input text: `"ಕನ್ನಡ"`
   - Segment into grapheme clusters: `["ಕ", "ನ್", "ನ", "ಡ"]`
   - Convert each cluster to its alphabet index
   - Pad to 400 clusters with spaces (index 0)
   - Treat as base-56,028 number: `content_num = Σ (index[i] × 56028^i)`
   - Apply bijection: `address = (content_num × C) mod N`
   - Convert to hex and hierarchical format

2. **Browse (Address → Text)**:
   - Take hex address
   - Apply inverse: `content_num = (address × I) mod N`
   - Convert back to base-56,028 indices
   - Map indices to grapheme clusters
   - Format as 25 clusters per line

### Kannada Character Set

The alphabet systematically generates all valid Kannada grapheme clusters:
- Punctuation and spaces
- Independent vowels with optional modifiers
- Simple consonants
- Consonants with matras and modifiers
- Dead consonants (with halant)
- Two-consonant conjuncts with all combinations

This produces exactly **56,028 unique clusters**.

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
- Emphasis on readability and content
- Kannada-first design with proper font rendering

## Performance Characteristics

- **Text Generation**: O(n²) where n ≈ 6,300 bits - Very fast!
- **Search**: O(n²) - Instant for any query
- **Address Parsing**: O(n) - Efficient
- **No Database**: Everything is deterministic and computed on-demand
- **First Startup**: ~5 seconds to compute bijection constants
- **Subsequent Requests**: Milliseconds

## Development

### Running Tests

Backend tests:
```bash
cd backend
cargo test
```

### Building for Production

Backend:
```bash
cd backend
cargo build --release
```

Frontend:
```bash
cd frontend
npm run build
```

## Future Enhancements

1. **Precompute Constants** - Save C and I to files for instant startup
2. **Mandira Caching** - Cache Kannada mandira conversions
3. **Rate Limiting** - Protect API from abuse
4. **LRU Cache** - Cache frequently accessed pages
5. **Multiple Scripts** - Support for other Indic scripts (Telugu, Tamil, Malayalam)
6. **Dark Mode** - Theme toggle for different lighting conditions
7. **Export Pages** - Download as PDF or text
8. **Advanced Search** - Regex or pattern-based search
9. **Page Navigation** - Previous/next page in hierarchical order

## Philosophy

> "The universe (which others call the Library) is composed of an indefinite
> and perhaps infinite number of hexagonal galleries..."
>
> — Jorge Luis Borges, "The Library of Babel"

This implementation proves that with deterministic algorithms and elegant mathematics, we can create an infinite, reproducible space where every possible text exists at a definite, calculable location.

The use of Kannada script with 56,028 grapheme clusters creates a vastly larger space than the original (29^3200 vs 56028^400), yet remains fully navigable through the bijective mapping.

**Every possible Kannada text—including this very document—exists somewhere in the library.**

## License

This project is open source and available for educational and non-commercial use.

## Acknowledgments

- Jorge Luis Borges for the original concept
- Jonathan Basile for [libraryofbabel.info](https://libraryofbabel.info)
- The Rust and SvelteKit communities
- Unicode Consortium for Kannada character standardization
- Gwern Branwen for design inspiration