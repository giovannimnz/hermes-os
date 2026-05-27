# Phase 08: Screen Audience Classification

## Goal

Audit all 14 screens and classify them by viability on the web target. Document which screens work fully, which need adaptation, and which must be hidden or replaced on web.

## Requirements

- [R01] Create `src/shared/desktop/screenAudience.ts` — enum + classification map:
  ```typescript
  export enum ScreenAudience {
    ELECTRON_ONLY = 'electron',   // Desktop install flow
    ADAPTED       = 'adapted',   // Works on web with changes
    FULL           = 'full',      // Works identically on both
    HIDDEN         = 'hidden',     // Not applicable to web
  }

  export const SCREEN_CLASSIFICATION: Record<View, ScreenAudience> = {
    chat: ScreenAudience.FULL,
    sessions: ScreenAudience.ADAPTED,   // uses gateway sessions instead of local DB
    agents: ScreenAudience.FULL,         // profile management works via gateway
    office: ScreenAudience.ADAPTED,      // office documents depend on local fs
    kanban: ScreenAudience.ADAPTED,     // kanban API needs to be in gateway
    models: ScreenAudience.FULL,
    providers: ScreenAudience.ADAPTED,  // credential pool via gateway
    skills: ScreenAudience.ADAPTED,     // skill install via gateway
    soul: ScreenAudience.FULL,          // via gateway endpoints
    memory: ScreenAudience.FULL,         // via gateway endpoints
    tools: ScreenAudience.FULL,
    schedules: ScreenAudience.FULL,     // cron via gateway
    gateway: ScreenAudience.HIDDEN,      // embedded gateway status irrelevant
    settings: ScreenAudience.ADAPTED,   // remote config vs local
    install: ScreenAudience.ELECTRON_ONLY,
    welcome: ScreenAudience.ELECTRON_ONLY,
    setup: ScreenAudience.ELECTRON_ONLY,
  };
  ```

- [R02] Classification documented in phase plan with rationale per screen
- [R03] Screens marked `ELECTRON_ONLY` are not rendered on web (handled in App.tsx or Layout.tsx conditional)
- [R04] Screens marked `ADAPTED` have adaptation tickets filed (handled in subsequent phases)

## Screen-by-Screen Classification

| Screen | Audience | Rationale |
|--------|----------|-----------|
| **Chat** | FULL | Streaming via WebSocket works identically |
| **Sessions** | ADAPTED | Gateway sessions instead of local state.db; getSessionMessages via gateway endpoint |
| **Agents** | FULL | Profile management via gateway endpoints (Phase 03) |
| **Office** | ADAPTED | Office files need upload/download; gateway media endpoints needed |
| **Kanban** | ADAPTED | Kanban not in gateway yet; needs Phase 03 kanban endpoints |
| **Models** | FULL | Model config via gateway endpoints |
| **Providers** | ADAPTED | Credential pool via gateway endpoints (Phase 03) |
| **Skills** | ADAPTED | Skill install via gateway endpoints (Phase 03) |
| **Soul** | FULL | Soul read/write via gateway endpoints (Phase 03) |
| **Memory** | FULL | Memory via gateway endpoints (Phase 03) |
| **Tools** | FULL | Toolset config via gateway endpoints |
| **Schedules** | FULL | Cron via gateway (already supported in Phase 03) |
| **Gateway** | HIDDEN | Webapp IS the gateway connection; gateway status screen is internal |
| **Settings** | ADAPTED | Remote mode config, theme, locale work; some local paths not applicable |
| **Install** | ELECTRON_ONLY | Local Hermes installation, not applicable to web |
| **Welcome** | ELECTRON_ONLY | Installation entry point, not applicable to web |
| **Setup** | ELECTRON_ONLY | API key setup, not applicable if using gateway token |

## Verification

```typescript
// Classification exported and used
import { SCREEN_CLASSIFICATION, ScreenAudience } from '@/shared/desktop/screenAudience';

// App.tsx (web) checks classification before rendering
const isWeb = typeof window !== 'undefined' && !window.electron;
if (isWeb && SCREEN_CLASSIFICATION[view] === ScreenAudience.ELECTRON_ONLY) {
  return null; // or redirect to main screen
}
```

## Notes

Dependencies: Phase 03 (gateway endpoints partially complete)
