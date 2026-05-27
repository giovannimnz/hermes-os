# Phase 01: Fork Setup — hermes-os

## Goal

Repository correctly forked, remotes configured, upstream synchronized, package metadata renamed to `hermes-os`.

## Requirements

- [R01] Fork `fathah/hermes-desktop` as `giovannimnz/hermes-os` on GitHub
- [R02] Local repo at `/home/ubuntu/GitHub/hermes-desktop` tracks `giovannimnz/hermes-os` as `origin`
- [R03] `upstream` remote points to `fathah/hermes-desktop`
- [R04] `package.json` `name` updated to `hermes-os`
- [R05] `package.json` `version` reset to `0.6.0` (semantic versioning: starts fresh fork)
- [R06] `README.md` updated: fork badge, description, differences from upstream
- [R07] `.github/CODEOWNERS` created (optional, or existing preserved)
- [R08] GitHub Topics updated: `hermes-agent`, `electron`, `webapp`, `react`, `ai`

## Verification

```bash
# R02-R03
git remote -v
# origin → https://github.com/giovannimnz/hermes-os.git
# upstream → https://github.com/fathah/hermes-desktop.git

# R04-R05
cat package.json | grep -E '"name"|"version"'
# name: "hermes-os"
# version: "0.6.0"

# R08
gh repo edit giovannimnz/hermes-os --add-topic electron --add-topic webapp --add-topic react --add-topic hermes-agent 2>&1
```

## Notes

Done: fork created, remotes set, package.json updated, README updated, GitHub topics updated.
