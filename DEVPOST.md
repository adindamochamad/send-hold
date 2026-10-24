# Qloo Agentic Hackathon — Devpost submission copy

Use this text on [Devpost](https://qloo.devpost.com/). Submit before **30 Oct 2026, 11:45 pm EDT**.

## Project name

Send Hold

## Tagline

A night plan does not send until every line is in the headliner’s Qloo affiliated set.

## Demo URL (judges — use this)

**https://send-hold.vercel.app/** — Track A hackathon demo only. No login. Four folios, live Qloo when the host has `QLOO_API_KEY`.

Do **not** describe `/app` as part of the demo URL unless sign-up works on production (a 200 on `/app/sign-in` is not enough — create a test account first).

## Repository

https://github.com/adindamochamad/send-hold

## Description (paste into Devpost)

Send Hold is a **Qloo-gated send pipeline** for live-night folios: Support, Dinner, and Drink must each resolve in Qloo and sit in the headliner’s affiliated set before anything can go out.

**Why Qloo is essential:** Without the taste graph, the app cannot know whether a dinner or drink belongs with a given headliner. Hold / clear / silent comes from Qloo `/search` and `/v2/insights` affiliation checks—not from an LLM guessing taste.

**Pipeline (deterministic, server-side):**

1. Resolve headliner and each line via Qloo search (artist / place / brand).
2. Check each line against the headliner’s affiliated set via insights.
3. Gate send: held or silent → block; cleared → server re-evaluates before any outbound action.
4. When held, suggest an in-set alternative from affiliated insights.

The **hosted demo** at `/` walks four scripted folios (held, held, silent negative control, cleared) in about 60 seconds. Optional product code at `/app` (Convex Auth, custom folios, history) is in the repo; mention it on Devpost only if that route is live on the same hostname.

**Stack:** Next.js, Qloo API (`hackathon.api.qloo.com`). Product path also uses Convex and optional Resend email.

**Note on “agentic”:** This submission is **Qloo-powered** taste intelligence with a clear send gate. It is not an autonomous LLM agent or agent framework; the value is cultural affiliation enforced by Qloo.

## What to try (60 seconds on demo URL)

1. North Wharf — dinner held, Cannot send  
2. Canal Room — drink held (brand out of set), Cannot send  
3. Late Set — no answer (negative control headliner)  
4. Open Door — cleared → Send plan → Send log entry  

Banner should read **Live Qloo evaluation** when `QLOO_API_KEY` is set on the host.

## License

MIT — see `LICENSE` in the repository root.

## Checklist before submit

- [ ] Demo URL loads `/` without login  
- [ ] Repo public with LICENSE visible in GitHub About  
- [ ] Description pasted on Devpost (pipeline wording, not “LLM agent”)  
- [ ] If `/app` is live: verify **sign-up** (not just sign-in page 200) and `/api/health`; otherwise omit `/app` from the pitch  
