# Phase 10: Web Build Verification

## Goal

Verify that `npm run build:web` produces a working webapp: builds without errors, serves in browser, renders the UI, and has zero console errors.

## Requirements

- [R01] `npm run build:web` exits with code 0 (no errors)
- [R02] `dist-web/` output is complete: `index.html`, `assets/`, JS/CSS bundles
- [R03] Serve `dist-web/` with any static server: `npx serve dist-web`
- [R04] Browser loads `index.html` without JavaScript errors
- [R05] React app mounts (root div gets populated)
- [R06] Zero console errors (Error level)
- [R07] TypeScript compilation passes: `npm run typecheck:web`
- [R08] No 404 resources (all JS/CSS/assets load correctly)

## Verification Commands

```bash
# R01-R02: Build
npm run build:web 2>&1
echo "Exit code: $?"

# R03: Serve locally
cd dist-web && npx serve -l 3456 &
sleep 2

# R04-R08: Check with curl or Playwright
curl -s http://localhost:3456 | grep -o '<title>.*</title>'
# Expected: <title>Hermes OS</title>

# Check JS bundle exists
ls dist-web/assets/*.js | head -3

# R07: Type check
npm run typecheck:web 2>&1 | tail -5
```

## Manual Browser Test

Open `http://localhost:3456` and verify:
1. Splash screen (brief) → redirects to Connect Gateway modal (first time)
2. Or if token exists → Chat screen loads
3. No "hermesAPI is not defined" errors in console

## Notes

Dependencies: Phase 04 (scaffold), Phase 05 (adapter), Phase 09 (screen removal)
