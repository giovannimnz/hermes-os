# Phase 18: UAT — Full Feature Verification

## Goal

End-to-end acceptance testing for both Electron and web targets. All major features verified working on both platforms before the milestone is closed.

## Requirements

### Electron Target
- [E01] App launches, shows splash, navigates to Chat
- [E02] Send message → streaming response renders in real-time
- [E03] Reasoning bubbles display correctly
- [E04] Session list shows all sessions with correct titles
- [E05] Resume session → history loads, model responds contextually
- [E06] Create/switch/delete profiles
- [E07] Memory entries: add, view, update, delete
- [E08] Soul: read, write, reset
- [E09] Skills: list installed, install from bundled, uninstall
- [E10] Tools: enable/disable toolsets
- [E11] Cron jobs: create, list, pause, resume, delete
- [E12] Models: add, list, remove
- [E13] Providers: configure API keys, discover models
- [E14] Kanban: create board, create task, move task, complete task
- [E15] Settings: theme toggle (dark/light), language change, config values
- [E16] Gateway: status, start, stop (if embedded mode)
- [E17] App auto-update works (if update available)
- [E18] Install new Hermes version works

### Web Target
- [W01] App loads at gateway URL, ConnectGateway screen appears (first time)
- [W02] Enter valid token → connection succeeds → Chat screen
- [W03] Send message → streaming response renders in real-time
- [W04] Reasoning bubbles display correctly
- [W05] Session list: load, click to resume, search, delete
- [W06] Profile management: create, switch, delete profiles
- [W07] Memory entries: add, view, update, delete
- [W08] Soul: read, write, reset
- [W09] Skills: list, install, uninstall
- [W10] Cron jobs: create, list, pause, resume, delete
- [W11] Settings: theme toggle, language
- [W12] Disconnect/reconnect to different gateway works
- [W13] App installable as PWA (Add to Home Screen)
- [W14] Offline: session list cached, offline banner shown

### Both Targets
- [B01] No console errors (Error level)
- [B02] Dark/light theme renders correctly
- [B03] All 14 screens accessible (except Electron-only on web)
- [B04] Token usage displayed after each response
- [B05] Abort button stops streaming correctly

## UAT Script

```bash
# Electron
echo "=== ELECTRON UAT ==="
npm run build
# Launch .AppImage
# Manual testing per requirement above

# Web
echo "=== WEB UAT ==="
npm run build:web
npx serve dist-web -l 3456 &
sleep 2
# Manual testing per requirement above
```

## UAT Sign-Off Checklist

Each requirement above checked and marked:
- [ ] PASS
- [ ] FAIL (with bug ticket created)

## Milestone Closure

When all [B01-B05], all [E01-E18], and all [W01-W14] are PASS:
- Update ROADMAP.md: mark Phase 18 complete
- Update .planning/STATE.md: milestone status = closed
- Push all changes to `origin/main`
- Tag: `git tag v0.6.0 && git push origin v0.6.0`

## Notes

Dependencies: All previous phases (01-17)
