# Phase 14: Web Profile Management

## Goal

Implement multi-profile support for webapp via gateway endpoints. Users can create, switch, and delete profiles — all managed through the gateway.

## Requirements

- [R01] Agents screen (profile management) shows list of profiles via `GET /profiles`
- [R02] Create new profile: `POST /profiles` with name
- [R03] Clone profile: `POST /profiles?clone=<source>` copies config
- [R04] Delete profile: `DELETE /profiles/<name>`
- [R05] Switch active profile: stored in `localStorage` as `hermes_os_active_profile`
- [R06] All API calls include `profile` param when not using default
- [R07] Profile indicator in sidebar (shows current profile name)
- [R08] Default profile cannot be deleted

## Profile Indicator in Sidebar

```typescript
// In Layout.tsx sidebar footer:
const activeProfile = localStorage.getItem('hermes_os_active_profile') || 'default';
// Shows: "default" or profile name in sidebar footer
```

## Profile Switch Flow

```
User selects profile in Agents screen
  → setActiveProfile(name)
    → localStorage.setItem('hermes_os_active_profile', name)
    → Reload chat messages for new profile
    → Update sidebar indicator
```

## Verification

```bash
# Create profile "work"
# Switch to "work" profile
# Send message in "work" profile
# Switch to "default"
# "work" session history is separate from default
```

## Notes

Dependencies: Phase 03 (R01: profile endpoints), Phase 05 (web adapter)
