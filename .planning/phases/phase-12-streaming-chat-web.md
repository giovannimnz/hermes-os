# Phase 12: Streaming Chat on Web

## Goal

Verify end-to-end streaming chat works on web: message sent via WebSocket, chunks arrive, UI updates in real-time, reasoning bubbles render, session persists.

## Requirements

- [R01] `sendMessage` via WebSocket → streaming chunks arrive via `onChatChunk`
- [R02] Reasoning bubbles (`onChatReasoningChunk`) render correctly
- [R03] Tool progress (`onChatToolProgress`) shows in UI
- [R04] Token usage (`onChatUsage`) displayed after response
- [R05] `onChatDone` fires after stream completes, triggers `getSessionMessages` merge
- [R06] `abortChat()` sends abort message over WebSocket, stops streaming
- [R07] Session resumption: `resumeSessionId` passed to `sendMessage`, history sent as `history` param
- [R08] Attachments sent with message (via `attachments` param)
- [R09] Context folder sent (via `context_folder` param)
- [R10] ChatInput handles loading state, submit, abort identically to Electron

## Chat Streaming Flow (Web)

```
User types message → ChatInput.onSubmit
  → useChatActions.handleSend(text, attachments)
    → window.hermesAPI.sendMessage(text, profile, sessionId, history, attachments)
      → WebAdapter.sendMessage():
        1. WS.send({ type: "execute", prompt: text, history, attachments, ... })
        2. WS listener: on('chunk') → setMessages(prev => append chunk)
        3. WS listener: on('reasoning_chunk') → setMessages(prev → add/update reasoning bubble)
        4. WS listener: on('done', sessionId) → setIsLoading(false), setHermesSessionId
        5. WS listener: on('error') → setMessages(prev → add error message)
        6. Returns promise that resolves when 'done' received
```

## Abort Implementation

WebSocket protocol extension:
```json
{ "type": "abort" }
```
Gateway closes the subprocess, sends `error` event to WebSocket:
```json
{ "type": "error", "code": 499, "message": "Client aborted" }
```

## Testing Checklist

- [ ] Send simple text message → response streams and renders
- [ ] Send message with history → model responds contextually
- [ ] Click abort during streaming → stream stops, UI resets
- [ ] Reasoning bubble appears during stream (if model produces reasoning)
- [ ] Tool progress indicator shows when tool is executing
- [ ] Token count appears after response
- [ ] Switch sessions → history loads correctly
- [ ] Attach image → attachment sent, model sees it

## Verification

Manual test with Playwright:
```typescript
await page.goto('http://localhost:3456');
await page.fill('input[type="text"]', 'Hello, what is 2+2?');
await page.click('button[type="submit"]');
// Wait for streaming
await expect(page.locator('.message-assistant')).toBeVisible();
// Wait for completion
await expect(page.locator('.token-count')).toContainText('tokens');
```

## Notes

Dependencies: Phase 05 (web adapter), Phase 10 (web build)
