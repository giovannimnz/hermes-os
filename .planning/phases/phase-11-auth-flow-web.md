# Phase 11: Auth Flow for Webapp

## Goal

Implement the gateway token authentication flow for the webapp: token input UI, localStorage storage, connection test, and error handling.

## Requirements

- [R01] `ConnectGateway` screen created in `src/renderer/src/screens/ConnectGateway/`
- [R02] Shown on first load if no token in localStorage
- [R03] Fields: Gateway URL (default: env var or `ws://localhost:8200/ws`), Token (password input)
- [R04] "Connect" button → `GET /health` with Bearer token → success → store and proceed
- [R05] Error state: shown if health check fails (invalid token, gateway offline)
- [R06] Token stored in `localStorage` as `hermes_os_gateway_token`
- [R07] Gateway URL stored in `localStorage` as `hermes_os_gateway_url`
- [R08] Token clear/logout option in Settings screen
- [R09] Active profile stored in `localStorage` as `hermes_os_active_profile`
- [R10] Webapp can reconnect to different gateway (token change in Settings)

## ConnectGateway Screen

```typescript
// src/renderer/src/screens/ConnectGateway/ConnectGateway.tsx
interface ConnectGatewayProps {
  onConnected: () => void;
}

// Flow:
// 1. User enters gateway URL + token
// 2. Click "Connect"
// 3. fetch(`${url}/health`, { headers: { Authorization: `Bearer ${token}` } })
// 4. Success → localStorage.setItem('hermes_os_gateway_token', token) → onConnected()
// 5. Failure → show error message
```

## Token Management Utilities

```typescript
// src/shared/desktop/adapters/tokenStore.ts
export function getStoredToken(): string | null {
  return localStorage.getItem('hermes_os_gateway_token');
}

export function setStoredToken(token: string): void {
  localStorage.setItem('hermes_os_gateway_token', token);
}

export function clearStoredToken(): void {
  localStorage.removeItem('hermes_os_gateway_token');
}

export function getStoredGatewayUrl(): string {
  return localStorage.getItem('hermes_os_gateway_url')
    || import.meta.env.VITE_HERMES_GATEWAY_URL
    || 'ws://localhost:8200/ws';
}
```

## Settings Screen Addition

Add to Settings screen (webapp only):
- "Connected to: `<gateway_url>`" display
- "Change token" button → opens ConnectGateway modal
- "Disconnect" → clears token, returns to ConnectGateway

## Verification

```bash
# Manual: open webapp → ConnectGateway modal appears
# Enter wrong token → error shown
# Enter correct token → Chat screen loads
```

## Notes

Dependencies: Phase 09 (electron-only screens removed), Phase 03 (gateway endpoints)
