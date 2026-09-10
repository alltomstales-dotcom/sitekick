import type { GeoLayer } from '../../data/geo';
import type { LegalEntity } from '../../data/types';

/** Client-side tool surface (GEV-style). Swap the planner; keep these tools stable. */
export type MapToolName =
  | 'highlight_family'
  | 'highlight_external'
  | 'highlight_payer'
  | 'focus_site'
  | 'show_path'
  | 'filter_layers'
  | 'toggle_sdoh'
  | 'count_systems'
  | 'explain_edge'
  | 'what_is'
  | 'clear';

export interface MapToolCall {
  name: MapToolName;
  args?: Record<string, unknown>;
}

/** Structured plan from the intent router (or a future LLM). */
export interface MapQueryPlan {
  /** Human-readable interpretation */
  interpretation: string;
  tools: MapToolCall[];
  /** True when no tool matched — do not invent map actions */
  unmatched?: boolean;
}

export interface MapToolResult {
  ok: boolean;
  tool: MapToolName;
  /** HUD chip copy — only report what actually ran */
  message: string;
}

export interface MapQueryEffects {
  /** Entity ownership filter */
  entity?: LegalEntity | 'all';
  dataClass?: 'all';
  region?: 'all';
  /** Node ids to brighten (null = no query highlight) */
  highlightIds?: string[] | null;
  selectedId?: string | null;
  /** Narrative id to activate as path */
  pathId?: string | null;
  /** Clear active path */
  clearPath?: boolean;
  /** Geo layer visibility (partial patch) */
  geoLayers?: Partial<Record<GeoLayer, boolean>>;
  /** Reset geo layers to defaults */
  resetGeoLayers?: boolean;
  /** SDOH choropleth overlay on Geo map: 'svi' | 'off' */
  sdohOverlay?: 'svi' | 'off';
}

export interface MapToolExecution {
  results: MapToolResult[];
  effects: MapQueryEffects;
  /** Combined HUD answer when multiple tools succeed */
  hud: string | null;
}

export const EXAMPLE_PROMPTS = [
  'Show AHN family',
  'Where is West Penn?',
  'Highlight UPMC ADT path',
  'How many external systems?',
  "What's Axon Connect?",
] as const;
