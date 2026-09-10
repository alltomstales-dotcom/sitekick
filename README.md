# SiteKick · Site Survey Index

V0 concept demo: a **Site Survey Index** dashboard for forward-deployed healthcare integration engineers.

**Scenario:** Highmark-like payer + AHN-like provider hybrid network.  
**All data is synthetic (SIM).** No PHI, no real credentials, no production endpoints.

## Features

1. **Residency map** — interactive React Flow graph of systems and cross-silo paths, with filters (data class, legal entity, region) and a node detail drawer.
2. **Access matrix** — heat map of systems × reachability (`path` / `constrained` / `none` / `unknown`).
3. **Feed health** — simulated realtime ticks every 2–3s (message rate, lag, last-seen, errors) with a live indicator.
4. **Gap / $$ board** — ranked missing/broken paths with estimated dollar-impact hypotheses.

## Stack

- Vite + React 19 + TypeScript
- [@xyflow/react](https://reactflow.dev/) (React Flow)
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
- Systems cover Epic EHR, ECW ambulatory, Highmark claims/eligibility, lab, PACS, Rhapsody + Edge, MPI, HIE, EDW/RWD, scheduling, pharmacy, prior auth, payer portal, care management, and revenue cycle — all labeled **(SIM)**.
