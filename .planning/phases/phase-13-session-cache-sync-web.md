# Phase 13: Session Cache Sync via Gateway (Web)

## Goal

Implement session list, session history loading, search, and title sync for webapp via gateway endpoints. Users see their conversation history in the webapp.

## Requirements

- [R01] Sessions screen loads session list via `GET /sessions` → renders list
- [R02] Click session → `GET /sessions/<key>/messages` → messages load in Chat
- [R03] Session titles displayed (from session cache `title` field)
- [R04] New session created when `sendMessage` returns new `sessionId`
- [R05] `syncSessionCache()` called on app load → refreshes session list with titles
- [R06] Title generation: first user message text, cleaned, truncated to 45 chars
- [R07] Session search: `GET /sessions/search?q=query` → results displayed
- [R08] Delete session: `DELETE /sessions/<key>` → removed from list
- [R09] Active session indicator in Sessions screen

## Session List Display

```typescript
// Sessions screen: load sessions on mount
useEffect(() => {
  if (!visible) return;
  window.hermesAPI.listSessions(50, 0).then(setSessions);
}, [visible]);

// Resume session: load messages
async function resumeSession(session: Session) {
  const messages = await window.hermesAPI.getSessionMessages(session.id);
  setMessages(dbItemsToChatMessages(messages));
  setCurrentSessionId(session.id);
}
```

## Title Generation

```typescript
// Client-side title generation (same logic as Electron)
function generateTitle(firstUserMessage: string): string {
  if (!firstUserMessage) return 'Nova conversa';
  const cleaned = firstUserMessage
    .replace(/[#*_`~\[\]]/g, '')  // remove markdown
    .replace(/https?:\/\/\S+/g, '')  // remove URLs
    .trim();
  return cleaned.slice(0, 45) + (cleaned.length > 45 ? '...' : '');
}
```

## Verification

```bash
# Create sessions via chat (webapp)
# Sessions screen shows list
# Click session → messages load
# Delete session → disappears from list
# Search → filtered results
```

## Notes

Dependencies: Phase 03 (gateway endpoints R02, R03), Phase 05 (web adapter R04)
