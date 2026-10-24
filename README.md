# Send Hold

A night plan does not send when the confident line is missing from the headliner’s affiliated set (via [Qloo](https://docs.qloo.com/)).

The sheet shows three lines — **Support**, **Dinner**, **Drink** — for a headliner and city. Server-side evaluation resolves entities in Qloo and checks affiliation before anything can be sent.

## Status modes

| Mode | Meaning |
|------|---------|
| **Held** | At least one line is not in the headliner’s affiliated set; nothing sends. |
| **No answer** | Qloo did not return a usable result; nothing sends. |
| **Cleared** | All lines are in set; **Send** is allowed (server re-checks on click). |

## Getting started

```bash
npm install
cp .env.example .env.local   # add QLOO_API_KEY for live evaluation
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Environment

| Variable | Required | Description |
|----------|----------|-------------|
| `QLOO_API_KEY` | No | Qloo API key (`X-Api-Key`). Without it, the UI uses **local fixtures** only (banner shown). |
| `QLOO_API_BASE_URL` | No | Default `https://hackathon.api.qloo.com`. Hackathon keys **must** use this host (not `api.qloo.com`). |

## 60-second demo script

With `QLOO_API_KEY` set, the masthead shows **Live Qloo evaluation.** Click each folio in order:

1. **North Wharf** — dinner **Joe Pizza** (place) not in Taylor Swift’s set → **Held**, Cannot send. If Qloo returns an in-set alternative, it appears under the held line.
2. **Canal Room** — drink **Mammee Noodle Snack** (brand) not in Beyoncé’s set → **Held**, Cannot send.
3. **Late Set** — **negative control**: headliner `zzznomatch999xyz` does not resolve in Qloo → **No answer**, Cannot send.
4. **Open Door** — all lines in set → **Cleared** → **Send plan** → entry appears in **Send log**.

Without a key, the same folios use **fixture** rules (`silent` flag on Late Set); the banner says local fixture.

## Track B — Product (`/app`)

The hackathon demo stays at **`/`** (four hardcoded folios). Product v1 is at **`/app`**:

1. Run `npx convex dev` once (writes `NEXT_PUBLIC_CONVEX_URL` to `.env.local`).
2. Sign up / sign in at [http://localhost:3000/app/sign-in](http://localhost:3000/app/sign-in).
3. Create a folio, pick entities via Qloo search, **Evaluate**, then **Send** when cleared.
4. Evaluations and sends are stored in Convex; cleared sends email via **Resend** when configured.

Set on the **Convex** deployment (`npx convex env set`): `QLOO_API_KEY`, `QLOO_API_BASE_URL`, `RESEND_API_KEY`, `SEND_HOLD_FROM_EMAIL`.

Health check: `GET /api/health` → `{ next, convex, qlooConfigured }`.

## Project layout

- `app/plans.ts` — demo folios and types
- `app/sheet.tsx` — demo sheet UI + send log
- `app/app/` — Track B (Convex Auth, CRUD, picker, history)
- `convex/` — schema, plans, folio actions, cache, rate limits
- `lib/qloo/` — Qloo core + server-only Next client
- `lib/plan-evaluation-core.ts` — shared evaluate (demo + Convex)
- `app/actions/send-hold.ts` — demo server actions

## Scripts

- `npm run dev` — development server
- `npm run build` — production build
- `npm run lint` — ESLint
- `npm test` — Vitest (mocked Qloo; no live API key required)
- `npm run convex:dev` — Convex dev deployment + codegen

## Deploy (Vercel)

**Live demo:** [https://send-hold.vercel.app](https://send-hold.vercel.app)

Set `QLOO_API_KEY` and `QLOO_API_BASE_URL=https://hackathon.api.qloo.com` in the Vercel project environment. For `/app`, set Convex **production** URLs (after `npx convex deploy --yes`):

- `NEXT_PUBLIC_CONVEX_URL=https://impartial-elk-202.convex.cloud`
- `NEXT_PUBLIC_CONVEX_SITE_URL=https://impartial-elk-202.convex.site`

Set `QLOO_*`, `RESEND_API_KEY`, and `SEND_HOLD_FROM_EMAIL` on the Convex production deployment (`npx convex env set --prod`). Do not commit `.env.local`.

## Hackathon submit

Copy-paste text for Devpost: [DEVPOST.md](DEVPOST.md). Open-source license: [LICENSE](LICENSE) (MIT).

## Agentic story (short)

Send Hold behaves as a **Qloo-powered gate agent**: search entities, check affiliated sets, refuse send on held/silent, re-check on send, and surface ranked in-set alternatives—without Qloo there is no hold decision.
