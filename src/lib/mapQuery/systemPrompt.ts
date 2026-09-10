/**
 * SiteKick Map Query — system prompt + tool contract (SIM).
 *
 * V0 uses a lightweight client-side intent router (regex/keyword → JSON plan).
 * To swap in a real LLM later (e.g. OpenAI Chat Completions or Realtime):
 *
 * 1. Keep TOOL_DEFINITIONS and executeMapTools() unchanged.
 * 2. Send MAP_QUERY_SYSTEM_PROMPT + user utterance to the model.
 * 3. Ask the model to return ONLY a MapQueryPlan JSON object:
 *      { "interpretation": string, "tools": [{ "name": MapToolName, "args": {...} }] }
 * 4. Pass that plan to executeMapTools(plan) — map effects stay client-side.
 * 5. For GEV-style Realtime: register the same tools as client tools; on
 *    tool_call events, call executeMapTools with the tool name/args.
 *
 * Never freeform-hallucinate map state — only apply effects from successful tools.
 */

export const MAP_QUERY_SYSTEM_PROMPT = `You are SiteKick Map Query for the Highmark Hybrid SIM residency map.

Context (all synthetic / SIM — no PHI):
- Highmark-like payer + AHN-like provider hybrid network in western/central PA.
- Family = owned AHN hospitals; External = UPMC, Independence, Penn State, WellSpan, Tower; Payer = Highmark claims/elig/prior auth; Shared = Rhapsody, Axon, MPI, HIE, EDW.
- Logical map and Geo map (Scout markers) share the same system graph.

Rules:
- Respond ONLY with a JSON MapQueryPlan: { "interpretation": string, "tools": MapToolCall[] }.
- Use ONLY the listed tools. Prefer one primary tool; chain clear only when resetting.
- If the ask is ambiguous or unsupported, return { "interpretation": "...", "tools": [], "unmatched": true }.
- Do not invent system ids, path ids, or counts — tools resolve against live SIM data.

Available tools:
1. highlight_family — brighten Highmark Family (AHN) nodes.
2. highlight_external — brighten External Network hubs.
3. highlight_payer — brighten Highmark payer systems.
4. focus_site { query: string } — fuzzy-match a site/system by name or id and select it.
5. show_path { query: string } — fuzzy-match a path narrative (e.g. UPMC ADT, prior auth) and highlight that path.
6. filter_layers { layers: string[] } — Geo layers: ahn-hospitals | neighborhood | highmark-hq | external | shared. Values may be labels like "AHN hospitals", "HQ", "Shared / interop", "rhapsody".
6b. toggle_sdoh { overlay: "svi"|"off" } — PA county SVI choropleth under pins (aggregate public · not PHI).
7. count_systems { entity?: "family"|"external"|"payer"|"shared"|"all" } — answer with count + short list.
8. explain_edge { query: string } — short SIM-safe blurb for an edge (by protocol or "A to B").
9. what_is { query: string } — short SIM-safe blurb from node data.
10. clear — reset highlights, filters, selection, and active path.
`;

export const TOOL_DEFINITIONS = [
  {
    name: 'highlight_family',
    description: 'Highlight Highmark Family (AHN) systems on the residency map',
    parameters: { type: 'object', properties: {} },
  },
  {
    name: 'highlight_external',
    description: 'Highlight External Network systems',
    parameters: { type: 'object', properties: {} },
  },
  {
    name: 'highlight_payer',
    description: 'Highlight Highmark payer systems',
    parameters: { type: 'object', properties: {} },
  },
  {
    name: 'focus_site',
    description: 'Focus/select a site by fuzzy name or id',
    parameters: {
      type: 'object',
      properties: { query: { type: 'string' } },
      required: ['query'],
    },
  },
  {
    name: 'show_path',
    description: 'Show a curated path narrative by id or keyword',
    parameters: {
      type: 'object',
      properties: { query: { type: 'string' } },
      required: ['query'],
    },
  },
  {
    name: 'filter_layers',
    description: 'Toggle Geo map layers (AHN hospitals, neighborhood, HQ, external, shared/interop)',
    parameters: {
      type: 'object',
      properties: {
        layers: { type: 'array', items: { type: 'string' } },
        exclusive: { type: 'boolean' },
      },
      required: ['layers'],
    },
  },
  {
    name: 'toggle_sdoh',
    description: 'Show or hide PA county SVI SDOH choropleth (aggregate public metrics)',
    parameters: {
      type: 'object',
      properties: {
        overlay: { type: 'string', enum: ['svi', 'off'] },
      },
      required: ['overlay'],
    },
  },
  {
    name: 'count_systems',
    description: 'Count systems optionally filtered by ownership entity',
    parameters: {
      type: 'object',
      properties: {
        entity: {
          type: 'string',
          enum: ['family', 'external', 'payer', 'shared', 'all'],
        },
      },
    },
  },
  {
    name: 'explain_edge',
    description: 'Explain an edge from SIM graph data',
    parameters: {
      type: 'object',
      properties: { query: { type: 'string' } },
      required: ['query'],
    },
  },
  {
    name: 'what_is',
    description: 'Short description of a system/node from SIM data',
    parameters: {
      type: 'object',
      properties: { query: { type: 'string' } },
      required: ['query'],
    },
  },
  {
    name: 'clear',
    description: 'Clear query highlights, filters, selection, and path',
    parameters: { type: 'object', properties: {} },
  },
] as const;
