# Phase 07: Shared Types Migration

## Goal

Move all shared types currently scattered across the renderer and main process into `src/shared/`. Establish `src/shared/` as the single source of truth for all TypeScript types used by both Electron and web targets.

## Requirements

- [R01] `src/shared/attachments.ts` — already exists, keep as-is
- [R02] `src/shared/types/` directory created with organized sub-files:
  - `src/shared/types/chat.ts` — `ChatMessage`, `DbHistoryItem`, `CachedSession`, `Session`, `SearchResult`
  - `src/shared/types/profile.ts` — `Profile`, `ProfileConfig`
  - `src/shared/types/soul.ts` — soul/personality types
  - `src/shared/types/memory.ts` — memory entry types
  - `src/shared/types/skill.ts` — `Skill`, `BundledSkill`, `Toolset`
  - `src/shared/types/model.ts` — `Model`, `ProviderDiscoveryResult`
  - `src/shared/types/cron.ts` — `CronJob`
  - `src/shared/types/kanban.ts` — `Board`, `KanbanTask`, `CreateTaskInput`, `KanbanTaskFilters`
  - `src/shared/types/credential.ts` — `CredentialPoolEntry`
  - `src/shared/types/gateway.ts` — `GatewayStatus`, `ConnectionConfig`, `Claw3dStatus`
  - `src/shared/types/usage.ts` — `UsageState`, `UsageInfo`
  - `src/shared/types/common.ts` — `Attachment` (reexport from attachments.ts), generic types
- [R03] All imports in renderer (`src/renderer/src/`) updated to import from `src/shared/`
- [R04] All imports in preload (`src/preload/`) updated to import from `src/shared/`
- [R05] `src/shared/desktop/types.ts` imports all types from `src/shared/types/` (single re-export)
- [R06] `src/shared/assets/main.css` — move renderer CSS here so both targets import from same location
- [R07] All `import ... from '@renderer/...'` aliases updated to use `src/shared/` where applicable
- [R08] `tsconfig.json` updated to include `src/shared` in compilation paths
- [R09] No type duplication — each type defined exactly once

## Verification

```bash
# No duplicate type definitions
grep -r "interface ChatMessage" src/ --include="*.ts" --include="*.tsx"
# Expected: exactly 1 result in src/shared/types/chat.ts

# All renderer imports from shared resolve
npm run typecheck:web 2>&1 | grep -i "cannot find" | head -10
# Expected: empty

# CSS shared
ls src/shared/assets/main.css
# Expected: file exists
```

## Notes

Dependencies: Phase 02 (interface extracted), Phase 04 (web scaffold)
