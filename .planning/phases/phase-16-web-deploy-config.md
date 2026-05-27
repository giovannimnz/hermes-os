# Phase 16: Web Deploy Configuration

## Goal

Configure deployment for the webapp: choose hosting platform, set environment variables, configure build pipeline, and establish deployment process.

## Requirements

- [R01] Choose hosting: Vercel (recommended), Cloudflare Pages, or self-hosted Docker
- [R02] `vercel.json` or `cloudflare-pages.toml` created with correct configuration
- [R03] Environment variables configured in hosting platform:
  - `VITE_HERMES_GATEWAY_URL` — gateway WebSocket URL (e.g., `wss://gateway.example.com/ws`)
  - `VITE_HERMES_GATEWAY_TOKEN` — optional pre-shared token
- [R04] Build command: `npm run build:web`
- [R05] Output directory: `dist-web`
- [R06] Dockerfile created for self-hosted option (optional):
  ```dockerfile
  FROM node:20-alpine AS builder
  WORKDIR /app
  COPY package*.json ./
  RUN npm ci
  COPY . .
  RUN npm run build:web
  FROM nginx:alpine
  COPY --from=builder /app/dist-web /usr/share/nginx/html
  EXPOSE 80
  ```
- [R07] GitHub Actions workflow: `.github/workflows/deploy-web.yml`
  - Trigger: push to `main` branch
  - Steps: checkout → npm ci → npm run build:web → deploy
- [R08] `dist-web/` added to `.gitignore`
- [R09] README updated with webapp deployment instructions

## Environment Variables for Production

```
VITE_HERMES_GATEWAY_URL=wss://your-gateway-domain.com/ws
VITE_HERMES_GATEWAY_TOKEN=your-gateway-token
```

## CORS Considerations

Gateway must allow CORS from webapp domain:
- In `ws-api-server.py`: add CORS headers for production domain
- Or put gateway behind same domain (reverse proxy with path routing)

## Verification

```bash
# Deploy preview
# Check deployed URL
curl -s https://your-app.vercel.app | grep -o '<title>.*</title>'
# Expected: <title>Hermes OS</title>
```

## Notes

Dependencies: Phase 10 (web build verification)
