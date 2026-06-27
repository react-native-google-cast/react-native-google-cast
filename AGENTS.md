# Agent & Contributor Instructions

`react-native-google-cast` — a React Native wrapper for the Google Cast SDK (iOS + Android).

This file is the **single source of truth** for both AI agents and human contributors.
Claude Code reads `CLAUDE.md`, which just points here, so the two never drift.

## Project status: v5 rewrite

- **`main`** carries the stable **v4** line (old-architecture `RCTBridgeModule`). v4 is in
  maintenance mode — bug fixes only.
- **`v5`** is a ground-up rewrite onto the React Native **New Architecture** using **Nitro Modules**.

v5 architecture in one line: **thin Nitro bridge + fat TypeScript** — a single native transport with
thin TS façades (`CastSession`/`RemoteMediaClient`/`CastChannel`) over a central session-state machine
driven by native session events (no stateful native objects, so no use-after-free on disconnect).
The public roadmap is the GitHub **`v5` milestone**.

## Build & test

Current commands (v4 tooling; v5 will move to RN 0.78+, Nitrogen codegen, and a new example app):

```bash
yarn                 # install
yarn typescript      # tsc --noEmit
yarn lint            # eslint
yarn test            # jest
yarn prepare         # bob build (library output)
yarn bootstrap       # set up example + playground apps (incl. pods)
```

## Conventions

- TypeScript for all JS-layer code; keep listener fan-out, hooks, and the session-state machine in TS.
- Run `yarn typescript`, `yarn lint`, and `yarn test` before opening a PR.
- Follow existing patterns in `src/`; match surrounding style.

## Task tracking (maintainers — optional)

Maintainers coordinate v5 work with **beads** (`bd`), a local dependency-aware task graph. This is
**optional** and **not required to build, test, or contribute**. The beads store (`.beads/`), its
git/codex hooks, and the beads skill are local tooling and are gitignored — they are intentionally
not part of the repo.

- **If you use beads** (`bd` installed, `.beads/` present): `bd ready` shows available work; see the
  beads skill for the full workflow. To get the shared graph on a new machine, configure the Dolt
  remote and `bd dolt pull`.
- **If you don't**: ignore beads entirely. Use whatever task tracking you prefer (GitHub issues,
  your editor's TODOs, etc.). Contribution and review happen through GitHub as usual.
