# Phase 15: Electron Build Verification

## Goal

Verify that the Electron target still builds and runs correctly after all shared-type migrations and adapter changes. The Electron app must be unaffected by the web changes.

## Requirements

- [R01] `npm run build` (Electron) exits with code 0
- [R02] `.AppImage` or `.deb` (Linux) generated in `out/` directory
- [R03] Electron app launches and shows splash → main screen
- [R04] All screens render correctly (Chat, Sessions, Agents, etc.)
- [R05] Streaming chat works (IPC, not WebSocket)
- [R06] No TypeScript errors: `npm run typecheck`
- [R07] Preload works correctly: `window.hermesAPI` fully functional
- [R08] Better-sqlite3 compiles and loads (native module)
- [R09] Auto-updater functional (electron-updater)

## Verification

```bash
# Build
npm run build 2>&1 | tail -20
echo "Exit: $?"

# Check output
ls out/**/*.AppImage 2>/dev/null || ls out/**/*.deb 2>/dev/null
ls out/**/*.exe 2>/dev/null  # if on Windows

# Type check
npm run typecheck 2>&1 | grep -i error | head -10
# Expected: no errors

# Manual: launch app and verify Chat works
```

## Notes

Dependencies: Phase 02 (electron adapter), Phase 06 (electron adapter cleanup), Phase 07 (shared types)
