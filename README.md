# SiteKick · Site Survey Index

V0 concept demo: a **Site Survey Index** dashboard for forward-deployed healthcare integration engineers.

**Scenario:** Highmark-like payer + AHN-like provider hybrid network.  
**All data is synthetic (SIM).** No PHI, no real credentials, no production endpoints.

## Features

1. **Residency map** — **Logical** (default SVG/HTML canvas) or **Geo** (MapLibre + Esri dark raster basemap, no API keys) toggle. Western/central PA SIM-approx coords for Highmark HQ, AHN flagships, and external hubs; markers colored by family/external/payer. Filters, node detail drawer, and **click-path narratives** (dim non-path, brighten path + geo line highlight; clear with Esc / Clear path).
   - **Map Query / Voice** (GEV-inspired) — always-on “Ask the map…” bar + **Voice** mic (browser Web Speech API; no OpenAI key for V0). Client-side intent router maps NL → tools (`highlight_family` / `focus_site` / `show_path` / `filter_layers` / `count_systems` / `what_is` / …). HUD answer chip confirms only succeeded actions. Example chips: “Show AHN family”, “Where is West Penn?”, “Highlight UPMC ADT path”. Swap-in path for a real LLM documented in `src/lib/mapQuery/systemPrompt.ts`.
2. **Access matrix** — heat map of systems × reachability (`path` / `constrained` / `none` / `unknown`).
3. **Feed health** — simulated realtime ticks every 2–3s (message rate, lag, last-seen, errors) with a live indicator. Click a feed card to jump to the Residency Map and highlight the related systems + edges (same path UX as gaps).
4. **Gap / $$ board** — ranked missing/broken paths with estimated dollar-impact hypotheses. Click a curated gap to jump to the map path story.
5. **Day-1 Interview** — guided CoS checklist (systems & ownership, residency & access, cross-silo truth, engagement framing). Answers mark linked systems **interviewed** on the Residency Map (assumed = muted/dashed → interviewed = solid/✓ badge). Includes Scout-sharpened Highmark↔AHN prompts + **Rhapsody Axon** / **Axon Connect** (SIM). Reset for demo replay.
6. **Exec brief export** — printable one-pager (`window.print()`) plus `.md` download: Family vs External snapshot, top $$ gaps, week-one spike / SOW line with Axon + Axon Connect tooling, SIM disclaimer.

## Stack

- Vite + React 19 + TypeScript
- lucide-react icons
- maplibre-gl + Esri World Dark Gray raster basemap (inline style only; no API keys / no OpenFreeMap fallback)

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
- Systems cover AHN family hospitals, external network providers (UPMC, Independence, Penn State, WellSpan, Tower), Highmark claims/eligibility, prior auth, Rhapsody + Edge, **Rhapsody Axon** + **Axon Connect**, MPI, HIE, and EDW/RWD — all labeled **(SIM)**.
