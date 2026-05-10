# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Context

This is a fork of [WatchParty](https://github.com/howardchung/watchparty) being customized as a **private watch-together platform for nativos.cloud**. The target deployment is **OKE (Oracle Kubernetes Engine) on OCI (Oracle Cloud Infrastructure)**. Design and branding will follow the nativos.cloud identity.

## Commands

```bash
# Development (run in separate terminals)
npm run dev        # Backend with file watch (port 8080)
npm run ui         # Vite dev server for frontend

# Build
npm run build      # Typecheck server + build React (outputs to build/)
npm run buildReact # React build only

# Type checking
npm run typecheck        # Frontend TypeScript (noEmit)
npm run typecheckServer  # Backend TypeScript

# Format
npm run prettier   # Prettier write on all files

# Production (PM2 sharded)
npm run pm2        # Start with ecosystem.config.js
npm run deploy     # Pull release branch + restart PM2
```

Copy `.env.example` to `.env` and populate before starting. The server loads `.env` automatically via `node:process.loadEnvFile()`.

## Architecture

### Request Flow

1. Browser connects to Express (port 8080) via WebSocket (`socket.io`, websocket transport only — no long-polling).
2. On connection, `server.ts` resolves which shard owns the room via `resolveShard()` (first char of roomId mod numShards). If this shard doesn't own the room it may redirect the client.
3. A `Room` instance is loaded from PostgreSQL into memory on first connection and kept in the `rooms: Map<string, Room>` in `server.ts`. Rooms are periodically serialized back to Postgres (JSONB `data` column).
4. All real-time sync (play/pause/seek, chat, roster) goes through Socket.IO events handled in `server/room.ts`.

### Backend (`server/`)

- **`server.ts`** — Express + Socket.IO bootstrap, REST endpoints (`/metadata`, `/youtube`, `/stats`, etc.), room lifecycle (create/delete/shard routing).
- **`room.ts`** — `Room` class: all socket event handlers and state. Serialized fields (video URL, timestamp, chat, vBrowser, playlist, lock) are what gets persisted to Postgres. Non-serialized fields (roster, tsMap, intervals) are rebuilt on reconnect.
- **`config.ts`** — Single source of truth for all env vars with defaults. Spread over `process.env` so any env var overrides the default.
- **`vmWorker.ts`** — Separate HTTP service (port 3100) that manages the warm pool of virtual browser VMs. Talks to cloud providers and updates the `vbrowser` table.
- **`vm/`** — One class per cloud provider (Docker, Hetzner, DigitalOcean, Scaleway), all extending `VMManager` from `base.ts`. `VM_MANAGER_CONFIG` format: `provider:size:region:minSize:limitSize:hostname` (comma-separated for multiple pools).
- **`ecosystem.config.js`** — PM2 multi-process config: two web shards (ports 3001/3002), vmWorker (3100), syncSubs, timeSeries, cleanup, discordBot.

### Frontend (`src/`)

- **`index.tsx`** — Root: Firebase init, React Router v5 routes (`/`, `/create`, `/watch/:roomId`, `/r/:vanity`), `MantineProvider` (forced dark theme).
- **`MetadataContext.ts`** — Global context holding Firebase `user`, `isSubscriber`, `streamPath`, `convertPath`. When Firebase is not configured, `isSubscriber` defaults to `true` (all features unlocked).
- **`config.ts`** — Client-side env vars via `VITE_*` prefix (Vite exposes only those to the browser).
- **`components/App/`** — Main room view: video player, chat, video chat, controls.
- **`components/Home/`** — Landing page.
- UI library: **Mantine v8** (dark theme), **Tabler Icons**.

### Database (PostgreSQL)

Schema in `sql/schema.sql`. Key tables:
- `room` — persistent rooms; `data` JSONB holds serialized `Room` state.
- `vbrowser` — VM pool lifecycle (pool, vmid, state: available/staging/used, roomId assignment).
- `subscriber` — Stripe subscription records.
- `link_account` — OAuth linked accounts (Discord, etc.).

Redis is optional; used only for metrics counters (`redisCount`).

### Virtual Browser (vBrowser)

Powered by [neko](https://github.com/m1k1o/neko) (Chrome in a container with WebRTC). Two modes:
- **Stateless** (default when `VM_MANAGER_CONFIG` is unset): Docker-only, spins up/tears down on demand via `DOCKER_VM_HOST`.
- **Managed pool** (`VM_MANAGER_CONFIG` set): vmWorker maintains a warm pool across cloud providers for faster assignment. Assignment timeout is `VM_ASSIGNMENT_TIMEOUT` seconds (default 75).

For local development of vBrowser: `npm run testvBrowser` starts a neko container on localhost.

### Sharding

When `SHARD` env var is set, each server process only loads rooms whose `roomId[0].charCodeAt(0) % numShards + 1 === SHARD`. The number of shards is derived from `ecosystem.config.js` entries that have `env.SHARD` set.

## OCI / OKE Deployment Notes

- The existing `Dockerfile` builds a single Node 24 Alpine image that runs `npm start` (one unsharded server). For OKE, this will need a Kubernetes Deployment + Service + Ingress.
- No Kubernetes manifests exist yet — they will be added under `k8s/` or `deploy/`.
- `PORT`, `HOST`, database URLs, and all secrets should be injected via OCI Vault + K8s Secrets.
- The vBrowser pool may be adapted to use OCI Compute instances (a new `vm/oci.ts` provider extending `VMManager`).
- Redis is optional but recommended for metrics in production; OCI Cache with Redis is the natural fit.

## nativos.cloud Customization

- Branding, colors, and design tokens will follow the nativos.cloud identity — reference the nativos.cloud repo when applying styles.
- Stripe, Discord bot, and open subscriber features can be stripped/replaced with internal auth.
- `FIREBASE_ADMIN_SDK_CONFIG` + `VITE_FIREBASE_CONFIG` drive auth; replace with nativos.cloud SSO if needed.
- `FREE_ROOM_LIMIT`, `SUBSCRIBER_ROOM_LIMIT`, `ROOM_CAPACITY` should be tuned for private use (consider setting `ROOM_CAPACITY=0` for unlimited).
