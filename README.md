# SiteKick · Site Survey Index

V0 concept demo: a **Site Survey Index** dashboard for forward-deployed healthcare integration engineers.

**Scenario:** Highmark-like payer + AHN-like provider hybrid network.  
**All data is synthetic (SIM).** No PHI, no real credentials, no production endpoints.

## Features

1. **Residency map** — interactive SVG/HTML canvas of systems and cross-silo paths, with filters (data class, legal entity, region) and a node detail drawer. Supports **click-path narratives** (dim non-path nodes, brighten path, narrative strip; clear with Esc / Clear path).
2. **Access matrix** — heat map of systems × reachability (`path` / `constrained` / `none` / `unknown`).
3. **Feed health** — simulated realtime ticks every 2–3s (message rate, lag, last-seen, errors) with a live indicator.
4. **Gap / $$ board** — ranked missing/broken paths with estimated dollar-impact hypotheses. Click a curated gap to jump to the map path story.
5. **Exec brief export** — printable one-pager (`window.print()`) plus `.md` download: Family vs External snapshot, top $$ gaps, week-one spike / SOW line, SIM disclaimer.

## Stack

- Vite + React 19 + TypeScript
- lucide-react icons

## Run locally

```bash
npm install
npm run dev
```

Then open the URL Vite prints (usually `http://localhost:5173`).

```bash
npm run build    # production build
npm run preview  # preview the production build
```

## Notes

- Designed for laptop / conference-room demo (dark healthcare-ops aesthetic).
- Systems cover AHN family hospitals, external network providers (UPMC, Independence, Penn State, WellSpan, Tower), Highmark claims/eligibility, prior auth, Rhapsody + Edge, MPI, HIE, and EDW/RWD — all labeled **(SIM)**.
