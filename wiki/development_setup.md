# Development Setup

This page covers how to run Akshara-Mantapa locally in development mode, where the SvelteKit frontend talks to a local Axum HTTP server.

For production builds and GitHub Pages deployment, see [[Deployment]].

## Prerequisites

Install the following before getting started:

**Rust** (1.70 or later)

```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
```

Verify:

```bash
rustc --version
cargo --version
```

**Node.js** (18 or later)

Download from [nodejs.org](https://nodejs.org) or use a version manager like `nvm`.

Verify:

```bash
node --version
npm --version
```

**wasm-pack** (required for production builds, optional for local dev)

```bash
cargo install wasm-pack
```

## Running Locally

Development mode uses two separate processes: a Rust backend server and a Vite frontend dev server. Both need to run at the same time.

### Step 1: Start the Backend

```bash
cd backend
cargo run --bin server --features server --release
```

The `--release` flag is strongly recommended. The bijection constants (C and I) are computed at startup over 6,308-bit integers. This takes a few seconds even in release mode and significantly longer in debug mode.

When ready, the server prints:

```
╔══════════════════════════════════════════════════════════════╗
║  ಅಕ್ಷರ ಮಂಟಪ | Akshara Mantapa                                ║
║  A Library of Babel for Kannada                              ║
╠══════════════════════════════════════════════════════════════╣
║  Server: http://127.0.0.1:3000                               ║
╚══════════════════════════════════════════════════════════════╝
```

The backend listens on `http://127.0.0.1:3000`.

### Step 2: Start the Frontend

In a separate terminal:

```bash
cd frontend
npm install
npm run dev
```

The frontend starts on `http://localhost:5173`.

Open that URL in your browser. The app will detect it is in development mode and route all requests to `localhost:3000`.

## How the Two Modes Are Wired

The frontend switches between HTTP and WASM based on a single environment variable:

```typescript
// frontend/src/lib/api.ts
const USE_WASM = import.meta.env.PROD;
```

In local dev (`npm run dev`), `PROD` is `false`, so all API calls go to the Axum server. In a production build (`npm run build`), `PROD` is `true` and calls go to the bundled WASM module instead.

You do not need to build WASM to work in development mode.

## API Exploration

With the backend running, you can test endpoints directly:

```bash
# Health check
curl http://localhost:3000/

# Library statistics
curl http://localhost:3000/api/info

# Random page
curl http://localhost:3000/api/random

# Page by address
curl "http://localhost:3000/api/page?address=93cebf0ea1c..."

# Search for Kannada text
curl "http://localhost:3000/api/search?q=ಕನ್ನಡ"
```

See [[API Reference]] for the full list of endpoints and response shapes.

## Building WASM Locally

If you want to test the production (WASM) path locally:

```bash
# 1. Build the WASM module
cd backend
wasm-pack build --target web --features wasm

# 2. Copy output to the frontend
mkdir -p ../frontend/src/lib/wasm
cp pkg/akshara_mantapa_bg.wasm ../frontend/src/lib/wasm/
cp pkg/akshara_mantapa.js ../frontend/src/lib/wasm/
cp pkg/akshara_mantapa.d.ts ../frontend/src/lib/wasm/

# 3. Build and preview the frontend
cd ../frontend
npm run build
npm run preview
```

The preview server will serve the static build locally. The app will run entirely in-browser with no backend server needed.

## Adding a New Script

The engine is designed to support multiple Indic scripts. To add one:

1. Create a new file in `backend/src/engine/`, for example `tamil.rs`, implementing the `GraphemeAlphabet` trait.
2. Expose it from `engine/mod.rs`.
3. Instantiate `LibraryOfBabel::new(TamilAlphabet)` wherever needed.

The bijection engine, library logic, types, and WASM bindings all work unchanged. Only the alphabet changes. See `engine/telugu.rs` for a working example.

## Common Issues

**"Constants take too long to compute"**

Make sure you are running with `--release`. Debug builds compute the 6,308-bit modular inverse in debug mode, which is noticeably slower.

**CORS errors in the browser**

The Axum server enables CORS for all origins by default. If you see CORS errors, confirm the backend is running and reachable at `localhost:3000`.

**WASM files missing**

If you see a WASM-related error during a production build, the WASM files have not been copied to `frontend/src/lib/wasm/`. Run the wasm-pack build and copy steps above.

---

**Related pages:** [[Architecture]] · [[Deployment]] · [[API Reference]]
