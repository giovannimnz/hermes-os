# Phase 04: Web Renderer Scaffold — Vite + Entry Point

## Goal

Create the web-specific build entry point (`src/web/`) and Vite configuration so that `npm run build:web` produces a deployable browser bundle — zero rendering at this stage, just build verification that the webapp boots.

## Requirements

- [R01] Create `src/web/main.tsx` — minimal React mount that renders `<App />` from renderer (shared)
- [R02] Create `src/web/index.html` — standard Vite HTML entry point, loads `main.tsx`
- [R03] Create `vite.web.config.ts` — Vite config for web-only build (no Electron APIs)
- [R04] Add `build:web` npm script: `vite build --config vite.web.config.ts`
- [R05] Create `src/web/env.d.ts` — declares `window.hermesAPI` for TypeScript (same shape as electron env.d.ts)
- [R06] Add `VITE_HERMES_GATEWAY_URL` environment variable (e.g., `ws://localhost:8200/ws`)
- [R07] Add `VITE_HERMES_GATEWAY_TOKEN` environment variable (Bearer token for auth)
- [R08] Build output: `dist-web/` directory (separate from `out/` which is Electron)
- [R09] No renderer code changes in this phase — just scaffolding
- [R10] Verify `npm run build:web` completes without errors

## File Structure

```
src/web/
  main.tsx          ← Entry point (renders App from renderer/src)
  index.html        ← HTML entry
  env.d.ts          ← TypeScript declarations for web env
  vite-env.d.ts     ← Vite client types

vite.web.config.ts  ← Web-specific Vite config (root level)
```

## vite.web.config.ts Design

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  root: resolve(__dirname, 'src/web'),
  base: './',  // Relative paths for deployment
  build: {
    outDir: resolve(__dirname, 'dist-web'),
    emptyOutDir: true,
    rollupOptions: {
      input: resolve(__dirname, 'src/web/index.html'),
    },
  },
  resolve: {
    alias: {
      '@renderer': resolve(__dirname, 'src/renderer/src'),
    },
  },
  define: {
    // Expose env vars
    'import.meta.env.VITE_HERMES_GATEWAY_URL': JSON.stringify(process.env.VITE_HERMES_GATEWAY_URL || 'ws://localhost:8200/ws'),
    'import.meta.env.VITE_HERMES_GATEWAY_TOKEN': JSON.stringify(process.env.VITE_HERMES_GATEWAY_TOKEN || ''),
  },
});
```

## src/web/main.tsx Design

```typescript
// src/web/main.tsx
// Web-only entry: no Electron, no IPC, just React + adapter injection
import './assets/main.css';  // Copy of renderer CSS

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ThemeProvider } from '../renderer/src/components/ThemeProvider';
import ErrorBoundary from '../renderer/src/components/ErrorBoundary';
import App from '../renderer/src/App';
import { I18nProvider } from '../renderer/src/components/I18nProvider';
import { initWebHermesAPI } from './webHermesInit';

// Initialize hermesAPI for web BEFORE React mounts
// This patches window.hermesAPI so the renderer is unaware
initWebHermesAPI();

const root = document.getElementById('root')!;
createRoot(root).render(
  <StrictMode>
    <I18nProvider>
      <ThemeProvider>
        <ErrorBoundary>
          <App />
        </ErrorBoundary>
      </ThemeProvider>
    </I18nProvider>
  </StrictMode>,
);
```

## src/web/webHermesInit.ts

This file imports and initializes the web adapter. The actual adapter is implemented in Phase 05.

```typescript
// Temporary stub — Phase 05 replaces this
export function initWebHermesAPI(): void {
  console.warn('[hermes-os] Web adapter not yet implemented');
  // window.hermesAPI = createWebAdapter(...);
}
```

## src/web/index.html

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="description" content="Hermes OS — AI Assistant for Web" />
  <title>Hermes OS</title>
</head>
<body>
  <div id="root"></div>
  <script type="module" src="./main.tsx"></script>
</body>
</html>
```

## Verification

```bash
# R10: Build succeeds
npm run build:web 2>&1 | tail -20
# Expected: "dist-web/index.html" created

# Check output
ls dist-web/
# Expected: index.html, assets/, etc.

# No TypeScript errors in web entry
npx tsc --noEmit -p tsconfig.web.json 2>&1 | head -20
```

## CSS Handling

The renderer uses `src/renderer/src/assets/main.css`. For web, this needs to be accessible. Options:

1. **Copy** the CSS into `src/web/` and import it in `main.tsx` (simplest)
2. **Alias** `@renderer/assets/main.css` in vite config
3. **Move CSS to `src/shared/assets/`** so both targets import from same location (preferred long-term)

Decision: Use option 3 — move `main.css` to `src/shared/assets/main.css` in Phase 07.

## Notes

Dependencies: Phase 01 (fork setup)
