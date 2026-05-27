# Phase 06: ElectronAdapter Cleanup

## Goal

Refactor the existing preload into the adapter pattern established in Phase 02. The preload continues to work exactly as before for the Electron target, but internally it's now implemented as a thin wrapper around `DesktopAdapter`.

## Requirements

- [R01] Create `src/shared/desktop/adapters/electronAdapter.ts` implementing `DesktopAdapter`
- [R02] ElectronAdapter wraps existing IPC calls from `src/preload/index.ts`
- [R03] `src/preload/index.ts` changes to: import ElectronAdapter, instantiate, expose via `contextBridge.exposeInMainWorld`
- [R04] Zero functional changes to Electron app — all existing behavior preserved
- [R05] `src/renderer/src/env.d.ts` updated to use `DesktopClient` from `src/shared/desktop/types.ts`
- [R06] `src/renderer/src/main.tsx` unchanged (no knowledge of which adapter)

## Implementation

```typescript
// src/shared/desktop/adapters/electronAdapter.ts
import type { DesktopAdapter } from '../types';
import type { Attachment } from '../../../shared/attachments';

export function createElectronAdapter(): DesktopAdapter {
  return {
    checkInstall: () => window.hermesAPI.checkInstall(),
    verifyInstall: () => window.hermesAPI.verifyInstall(),
    sendMessage: (message, profile, resumeSessionId, history, attachments, contextFolder) =>
      window.hermesAPI.sendMessage(message, profile, resumeSessionId, history, attachments, contextFolder),
    // ... all methods map 1:1 to window.hermesAPI
  };
}
```

```typescript
// src/preload/index.ts — modified
import { contextBridge, ipcRenderer } from 'electron';
import { createElectronAdapter } from '../shared/desktop/adapters/electronAdapter';

const electronAPI = { ... };  // Keep existing for window.electron

// Expose hermesAPI using the adapter pattern
const adapter = createElectronAdapter();
contextBridge.exposeInMainWorld('hermesAPI', adapter);
```

## Verification

```bash
# Electron still builds and runs
npm run build 2>&1 | tail -10
# No new TypeScript errors
npm run typecheck 2>&1 | grep -i error | head -10
# Electron app launches (manual test)
```

## Notes

Dependencies: Phase 02 (DesktopClient interface)
