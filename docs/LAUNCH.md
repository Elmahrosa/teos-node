# TEOS launch runbook

This is the operational checklist for going live without depending on a paid platform.
Code is the same everywhere; only environment variables differ.

## Topology

| Host | Platform | Role | Backend |
|---|---|---|---|
| `web4.elmahrosa.org` | Railway (`railway-hikari`) | Primary custom domain | Full (env configured) |
| `teos-node.vercel.app` | Vercel (free) | Standby / free path | Needs env (see below) |
| `teosnamesenqa2285.pinet.com` | Pi proxy -> app URL | Pi Browser entry | Inherits the app URL it points at |

If Railway billing lapses, the site keeps serving from Vercel as long as the Vercel env is complete.

## 1. Make Vercel fully functional (free)

The Vercel deployment currently renders every page but its API routes return `503`
because the store and RPC credentials are missing. Both services have free tiers with no card.

### Upstash Redis (durable store: registry, published sites, rate limits)

1. <https://console.upstash.com> -> create a Redis database (free).
2. Copy **REST URL** and **REST TOKEN**.
3. Add to Vercel -> Project -> Settings -> Environment Variables (Production + Preview):
   - `UPSTASH_REDIS_REST_URL`
   - `UPSTASH_REDIS_REST_TOKEN`

### Helius (Solana DAS: wallet name listing)

1. <https://dashboard.helius.dev> -> create an API key (free tier).
2. Add to Vercel:
   - `HELIUS_API_KEY`

### Base URL

Set so canonical links, NFT metadata and CSRF origin match the host actually used:

- `PUBLIC_BASE_URL=https://teos-node.vercel.app` (or the custom domain once pointed there)

### Optional but recommended for a real launch

- `TREASURY_WALLET` — receives payments (`/api/quote`).
- `REGISTRATION_OPEN=true` — only when you are ready to accept paid registrations.
- `MINT_AUTHORITY_KEYPAIR` — required to mint names.
- `FOUNDER_SESSION_SECRET`, `FOUNDER_PASSWORD_HASH` — founder dashboard.

After adding variables: **Redeploy** (Vercel does not apply env changes to an existing build).

## 2. Pi Hackathon / Pi Browser

The Pi portal app URL must point at a deployment that serves the validation key.

1. Pi Developer Portal -> your app -> **App URL** = `https://teos-node.vercel.app`
   (or `https://web4.elmahrosa.org` while Railway is healthy).
2. Confirm the key matches the portal value exactly:
   `https://<host>/validation-key.txt` must return 32 hex characters, `text/plain`,
   with **no trailing newline**.
3. Open the app inside Pi Browser and confirm the hero, language switch, and wallet modal work.

`next.config.mjs` already serves the key with `text/plain` and `no-cache`, and `middleware.ts`
excludes `.txt` so the CSP never touches it.

## 3. Verify any deployment in one command

```bash
node scripts/preflight.mjs https://teos-node.vercel.app
node scripts/preflight.mjs https://web4.elmahrosa.org
```

Exit code `0` means every check passed. It verifies:

- platform reachable and which one answered
- Phase 1 hero present
- stale "make a website for your company" claim gone from meta/JSON-LD
- `/api/live` 200 (liveness) and `/api/health` readable (readiness)
- `validation-key.txt` 200, `text/plain`, 32 hex, no newline
- `/browser`, `/wallet`, `/builder/demo` 200
- `/api/wallet/summary` 200 (Helius)
- `/api/site/*` healthy (Upstash)

## 4. Health semantics

- `GET /api/live` -> always `200 {ok:true}` while the process can answer. Use for uptime checks.
- `GET /api/health` -> `200` only when every launch prerequisite is configured, otherwise `503`.
  This is intentional: a missing key must never be hidden.

## 5. Railway billing

If the subscription is past due, new deploys are blocked but the running deployment keeps
serving. Do not delete the service: keep it as the custom-domain host until billing is resolved,
and use Vercel as the free standby.

## 6. Rollback

Every deploy is a git commit. To roll back, redeploy the previous commit from the platform
dashboard. Never force-push `main`.
