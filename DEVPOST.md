# Qloo Agentic Hackathon — Devpost submission copy

Use this text on [Devpost](https://qloo.devpost.com/). Submit before **30 Oct 2026, 11:45 pm EDT**.

## Project name

Send Hold

## Tagline

A night plan does not send until every line is in the headliner’s Qloo affiliated set.

## Demo URL

https://send-hold.vercel.app

## Repository

https://github.com/adindamochamad/send-hold

## Description (paste into Devpost)

Send Hold is a **taste-gated send agent** for live-night folios: Support, Dinner, and Drink must each resolve in Qloo and sit in the headliner’s affiliated set before anything can go out.

**Why Qloo is essential:** Without the taste graph, the app cannot know whether Joe Pizza belongs with Taylor Swift or Beyoncé. The hold/clear/silent decision is entirely grounded in Qloo search + insights—not LLM guesswork.

**Agentic workflow (tool use):**

1. **Resolve** headliner and each line via Qloo `/search` (artist / place / brand).
2. **Reason** with `/v2/insights` affiliation checks per line.
3. **Gate** send: held or silent → block; cleared → server re-evaluates, then (in product mode) dispatches email via Resend.
4. **Suggest** in-set alternatives from affiliated insights when a line is held.

The hackathon demo at `/` walks four scripted folios (held, held, silent negative control, cleared). Product mode at `/app` lets signed-in users build their own folios with entity picker, persisted evaluations, and send history (Convex).

**Stack:** Next.js, Qloo API (`hackathon.api.qloo.com`), Convex Auth + database, Resend.

## What to try (60 seconds)

1. North Wharf — dinner held, Cannot send  
2. Canal Room — drink held, Cannot send  
3. Late Set — no answer (negative control headliner)  
4. Open Door — cleared → Send plan → Send log entry  

Banner should read **Live Qloo evaluation** when `QLOO_API_KEY` is set on the host.

## License

MIT — see `LICENSE` in the repository root.

## Checklist before submit

- [ ] Demo URL loads without login  
- [ ] Repo public with LICENSE visible in GitHub About  
- [ ] This description pasted on Devpost  
- [ ] Optional: mention `/app` product path for judges who want CRUD + history  
