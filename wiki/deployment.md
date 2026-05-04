# Deployment

Akshara-Mantapa is deployed as a fully static site on GitHub Pages. There is no server in production. The entire Rust backend is compiled to WebAssembly and runs directly in the visitor's browser.

Deployment is automated through a GitHub Actions workflow that triggers on every push to `main`.

## How It Works

The production build involves three steps in sequence:

1. **Compile Rust to WASM**: `wasm-pack` compiles `backend/` to a `.wasm` binary and a JavaScript wrapper.
2. **Copy WASM into the frontend**: the compiled files are placed in `frontend/src/lib/wasm/`.
3. **Build the SvelteKit app**: Vite bundles the frontend, including the WASM files, into a static `build/` directory, which is then uploaded to GitHub Pages.

The frontend detects the production environment automatically:

```typescript
const USE_WASM = import.meta.env.PROD;
```

When `PROD` is `true`, all API calls go to the in-browser `WasmLibrary` instance rather than a remote server.

## CI/CD Pipeline

The workflow is defined in `.github/workflows/deploy.yaml`.

### Trigger

```yaml
on:
  push:
    branches: ['main']
  workflow_dispatch:
```

Every push to `main` triggers a deployment. You can also trigger manually from the GitHub Actions tab using `workflow_dispatch`.

### Build Job

The build job runs on `ubuntu-latest` and performs these steps in order:

**Checkout**

```yaml
- uses: actions/checkout@v4
```

**Install Rust with WASM target**

```yaml
- uses: dtolnay/rust-toolchain@stable
  with:
    targets: wasm32-unknown-unknown
```

**Install wasm-pack**

```yaml
- uses: jetli/wasm-pack-action@v0.4.0
  with:
    version: 'v0.12.1'
```

**Compile WASM**

```yaml
- name: Build WASM
  run: |
    cd backend
    wasm-pack build --target web --features wasm
```

This compiles the Rust library with the `wasm` feature enabled, which activates the `wasm-bindgen` bindings in `wasm.rs`. The output lands in `backend/pkg/`.

**Install frontend dependencies**

```yaml
- name: Install frontend dependencies
  run: |
    cd frontend
    npm ci
```

**Copy WASM to frontend**

```yaml
- name: Copy WASM to frontend
  run: |
    mkdir -p frontend/src/lib/wasm
    cp backend/pkg/akshara_mantapa_bg.wasm frontend/src/lib/wasm/
    cp backend/pkg/akshara_mantapa.js frontend/src/lib/wasm/
    cp backend/pkg/akshara_mantapa.d.ts frontend/src/lib/wasm/
```

Three files are copied: the binary (`.wasm`), the JS glue layer (`.js`), and the TypeScript declarations (`.d.ts`).

**Build frontend**

```yaml
- name: Build frontend
  run: |
    cd frontend
    npm run build
  env:
    NODE_ENV: production
```

SvelteKit builds to `frontend/build/`. Because `prerender = true` and `ssr = false` are set in `+layout.ts`, this produces a fully static site with no server-side rendering.

**Upload artifact**

```yaml
- uses: actions/upload-pages-artifact@v3
  with:
    path: frontend/build
```

### Deploy Job

The deploy job runs after the build job and pushes the artifact to GitHub Pages:

```yaml
deploy:
  needs: build
  environment:
    name: github-pages
    url: ${{ steps.deployment.outputs.page_url }}
  steps:
    - uses: actions/deploy-pages@v4
```

The deployed URL is the standard GitHub Pages URL for the repository.

## GitHub Pages Configuration

The workflow requires the following permissions:

```yaml
permissions:
  contents: read
  pages: write
  id-token: write
```

In your repository settings, GitHub Pages must be configured to deploy from GitHub Actions, not from a branch.

To enable this:

1. Go to **Settings -> Pages**
2. Under **Source**, select **GitHub Actions**

## What Gets Deployed

The `frontend/build/` directory contains:

- `index.html` and prerendered route HTML files
- Bundled JavaScript, including the WASM glue
- `akshara_mantapa_bg.wasm`: the compiled Rust binary
- Static assets (`favicon.svg`, `main-picture.png`, fonts)

The WASM binary is fetched by the browser on first load and cached. All subsequent library operations (page generation, search, navigation) run entirely in the browser without any network requests.

## Concurrency

```yaml
concurrency:
  group: 'pages'
  cancel-in-progress: false
```

If two deployments are triggered in quick succession, the second will queue rather than cancel the first. This avoids a deployment window where the site is unavailable.

## Performance Notes

- The WASM binary is large relative to a typical JS bundle, due to the size of the bijection constants and alphabet data.
- First load involves fetching and compiling the WASM module. Subsequent visits use the browser cache.
- Once loaded, all operations (search, browse, navigate) are near-instant, with no server round-trips.
- The startup cost of computing bijection constants present in local dev does not apply in WASM. The constants are baked into the compiled binary.

---

**Related pages:** [[Architecture]] · [[Development Setup]]
