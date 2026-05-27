# Phase 17: PWA Offline Support

## Goal

Add Progressive Web App capabilities to the webapp: service worker, offline caching, installability, and manifest.

## Requirements

- [R01] `public/manifest.json` with app metadata:
  - name: "Hermes OS"
  - short_name: "Hermes"
  - icons: app icon in multiple sizes
  - theme_color / background_color
  - display: "standalone"
  - start_url: "/"
- [R02] Service worker (`public/sw.js`) with Workbox:
  - Cache static assets (JS, CSS, fonts, icons) on install
  - Network-first for API calls (fall back to cache)
  - Offline page when gateway unreachable
- [R03] Install prompt: "Install Hermes OS" banner when PWA-installable
- [R04] Offline indicator in UI: banner when offline
- [R05] IndexedDB for session cache (offline session list)
- [R06] Cache API responses (session list, skills) with stale-while-revalidate

## vite-plugin-pwa (optional)

Use `vite-plugin-pwa` for automated service worker generation:
```typescript
// vite.web.config.ts
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      manifest: { /* as above */ },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
      },
    }),
  ],
});
```

## Offline Capabilities

| Feature | Offline Support |
|----------|----------------|
| View session list | Cached in IndexedDB |
| View old messages | Cached per session |
| Compose message | Queued, sent when online |
| Skills list | Cached |
| Settings | Local only |

## What Doesn't Work Offline

- Send message (requires gateway)
- Create/delete sessions
- Profile changes
- Memory/soul changes

## Verification

```bash
# Lighthouse PWA score
npx lighthouse https://your-app.vercel.app --only-categories=pwa
# Expected: PWA score >= 90
```

## Notes

Dependencies: Phase 16 (web deploy)
