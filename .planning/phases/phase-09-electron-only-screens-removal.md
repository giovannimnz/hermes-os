# Phase 09: Electron-Only Screens Removal from Web

## Goal

Remove or replace Electron-only screens (Install, Welcome, Setup) from the webapp build. These screens are compiled out via conditional rendering.

## Requirements

- [R01] App.tsx updated to check environment before rendering Electron-only screens:
  ```typescript
  // In renderScreen() switch — ELECTRON_ONLY screens return null on web
  const isElectron = typeof window !== 'undefined' && window.electron?.process?.platform;
  if (!isElectron) {
    if (screen === 'installing') return null;
    if (screen === 'welcome') return null;
    if (screen === 'setup') return null;
  }
  ```
- [R02] Webapp skips directly to `screen === 'main'` (Layout) on boot — no splash/install check
- [R03] `window.electron` presence check used as the environment detection mechanism
- [R04] `src/renderer/src/screens/Install/` and `screens/Welcome/` and `screens/Setup/` kept in codebase (not deleted — they are needed for Electron build)
- [R05] App.tsx type check: `window.electron?.process?.platform !== undefined` as Electron detector

## Implementation

Create `src/shared/desktop/envDetect.ts`:
```typescript
export function isElectronEnvironment(): boolean {
  return typeof window !== 'undefined' &&
    window.electron !== undefined &&
    window.electron.process !== undefined;
}

export function isWebEnvironment(): boolean {
  return !isElectronEnvironment();
}
```

Then in App.tsx, replace the splash/install check for web:
```typescript
useEffect(() => {
  if (isWebEnvironment()) {
    // Webapp: go straight to main after brief splash
    setTimeout(() => setScreen('main'), 500);
    return;
  }
  // Electron: run full install check
  runInstallCheck();
}, []);
```

## Screens for Webapp

For webapp, the "first-time setup" is different:
- No Hermes install needed (gateway is the backend)
- API key = gateway token (entered once and stored in localStorage)
- Instead of Setup screen: a simple "Connect to Gateway" modal on first load

Create `src/renderer/src/screens/ConnectGateway/` (new):
- Shown on first web load if no gateway token in localStorage
- Input: gateway URL (prefilled from env or `localhost:8200`)
- Input: gateway token (prefilled from env if set)
- "Connect" button → tests connection → stores token → goes to main

## Verification

```bash
# Phase 10 will verify: webapp boots directly to Chat screen
# No install/setup/welcome screens appear
```

## Notes

Dependencies: Phase 04 (web scaffold), Phase 05 (web adapter)
