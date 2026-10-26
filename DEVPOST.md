# Qloo Agentic Hackathon — Devpost submission copy

Use this text on [Devpost](https://qloo.devpost.com/). Editable until **30 Oct 2026, 11:45 pm EDT**.

## Project name

Send Hold

## Tagline

A night plan does not send until Qloo says every line belongs with the headliner.

## Demo URL (judges — use this)

**https://send-hold.vercel.app/** — no login. Four folios, live Qloo when the host has `QLOO_API_KEY`. Expand **Agent tool** on the sheet for `POST /api/agent/evaluate` request/response and curl.

Tool catalog: **https://send-hold.vercel.app/api/agent**

## Repository

https://github.com/adindamochamad/send-hold

## Devpost project

https://devpost.com/software/send-hold

## Built with (Devpost tags)

nextjs, typescript, qloo, vercel, convex

## Description (paste into Devpost)

Send Hold is an **agentic send-gate tool** for live-night folios. Night-of talent ops (and the agents that assist them) draft a plan: Support, Dinner, Drink around a headliner. A generic agent would send that draft. Send Hold **does not** — it calls Qloo, checks affiliation, and only allows send when every line is in the headliner’s affiliated set.

**Who it is for:** the person running the night — talent ops, production, or venue ops — who cannot afford to fire the wrong dinner or drink next to the headliner.

**Why Qloo is essential:** Without the taste graph, nothing can know whether a dinner or drink belongs with a given headliner. Hold / clear / silent comes from Qloo `/search` and `/v2/insights` affiliation checks — not from an LLM guessing taste.

**Generic vs Qloo (see the two panels on the demo):**

- Left: **Generic agent would send** — the draft as written.
- Right: **After the hold** — Qloo result; out-of-set lines are held with an in-set alternative when available.

**Agent tool (official hackathon shape: agentic tool):**

- `GET /api/agent` — tool descriptors and curl examples
- `POST /api/agent/evaluate` — `{ "planId": "north-wharf" }` or custom headliner + three lines
- `POST /api/agent/send` — re-evaluates; refuses held/silent; logs when cleared

**Pipeline (deterministic, server-side):**

1. Resolve headliner and each line via Qloo search (artist / place / brand).
2. Check each line against the headliner’s affiliated set via insights.
3. Gate send: held or silent → block; cleared → server re-evaluates before any outbound action.
4. When held, suggest an in-set alternative from affiliated insights.

The **hosted demo** at `/` walks four scripted folios (held, held, silent negative control, cleared) in about 60 seconds. Signed-in product at `/app` (Convex Auth, custom folios, history) uses the same evaluation core.

**Stack:** Next.js, Qloo API (`hackathon.api.qloo.com`), Vercel. Product path: Convex, optional Resend email.

**Honest scope:** This is not an autonomous LLM chatbot. Qloo is the permission check; agents call evaluate/send as tools.

## What to try (60 seconds on demo URL)

1. North Wharf — generic panel shows Joe Pizza; Qloo **held**, Cannot send  
2. Canal Room — drink held (brand out of set), Cannot send  
3. Late Set — no answer (negative control headliner)  
4. Open Door — cleared → Send plan → Send log entry  
5. Open **Agent tool** — copy curl for `POST /api/agent/evaluate` on the current folio  

Banner should read **Live Qloo evaluation** when `QLOO_API_KEY` is set on the host.

## 90-second video shot list (record + upload to Devpost)

Screen recording only; no talking head required. Upload unlisted YouTube/Loom and paste link on Devpost.

| # | Scene | ~sec | What to show |
| --- | --- | --- | --- |
| 1 | North Wharf | 20 | Generic panel vs held line; Cannot send; alt if shown |
| 2 | Canal Room | 15 | Drink held |
| 3 | Late Set | 10 | Silent / no answer |
| 4 | Open Door | 15 | Cleared → Send plan → send log |
| 5 | Agent tool + terminal | 20 | Expand Agent tool; run curl `POST /api/agent/evaluate` with `{"planId":"north-wharf"}`; JSON `held` |

Optional 4th gallery still: screenshot of **Agent tool** panel (3:2) → `docs/devpost/send-hold-devpost-agent-tool.jpg`

## License

MIT — see `LICENSE` in the repository root.

## Checklist (first-place push)

- [x] Demo URL loads `/` without login  
- [x] `GET /api/agent`, `POST /api/agent/evaluate`, `POST /api/agent/send` on production  
- [x] Generic vs Qloo panels + Agent tool on `/`  
- [ ] **Video** uploaded and linked on Devpost  
- [ ] Description pasted/updated on Devpost (this file)  
- [ ] Built with tags filled on Devpost  
- [x] Repo public, MIT in GitHub About  
- [ ] Confirm availability for **5 Nov** live finalist panel (US daytime) if notified  

## Checkpoint log

| Item | Status |
| --- | --- |
| Track A demo | https://send-hold.vercel.app/ |
| Agent API | `/api/agent`, `/api/agent/evaluate`, `/api/agent/send` |
| Gallery sources | `docs/devpost/send-hold-devpost-{cover,held,cleared}.jpg` |
