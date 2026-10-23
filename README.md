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

1. **North Wharf** — dinner **Joe Pizza** not in Taylor Swift’s set → **Held**, Cannot send.
2. **Canal Room** — drink line resolves via Qloo as a place not in Beyoncé’s set → **Held**, Cannot send.
3. **Late Set** — headliner does not resolve → **No answer**, Cannot send.
4. **Open Door** — all lines in set → **Cleared** → **Send plan** → entry appears in **Send log**.

Without a key, the same folios use **fixture** rules (`silent` flag on Late Set); the banner says local fixture.

## Project layout

- `app/plans.ts` — demo folios and types
- `app/sheet.tsx` — sheet UI + send log
- `lib/qloo/` — server-only Qloo client
- `lib/plan-evaluation.ts` — evaluate hold / silent / cleared
- `app/actions/send-hold.ts` — server actions for evaluate and send

## Scripts

- `npm run dev` — development server
- `npm run build` — production build
- `npm run lint` — ESLint

## Deploy (Vercel)

**Live demo:** [https://send-hold.vercel.app](https://send-hold.vercel.app)

Set `QLOO_API_KEY` and `QLOO_API_BASE_URL=https://hackathon.api.qloo.com` in the Vercel project environment. Do not commit `.env.local`.
