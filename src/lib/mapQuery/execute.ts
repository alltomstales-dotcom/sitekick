import { SYSTEMS, EDGES } from '../../data/systems';
import { PATH_NARRATIVES } from '../../data/narratives';
import {
  DEFAULT_GEO_LAYERS,
  GEO_LAYER_OPTIONS,
  type GeoLayer,
} from '../../data/geo';
import type { LegalEntity, SystemEdge, SystemNode } from '../../data/types';
import type {
  MapQueryEffects,
  MapQueryPlan,
  MapToolCall,
  MapToolExecution,
  MapToolResult,
} from './types';

function scoreMatch(hay: string, needle: string): number {
  const h = hay.toLowerCase();
  const n = needle.toLowerCase().replace(/\(sim\)/g, '').trim();
  if (!n) return 0;
  if (h === n) return 100;
  if (h.includes(n)) return 80;
  const tokens = n.split(/\s+/).filter(Boolean);
  let hit = 0;
  for (const t of tokens) {
    if (h.includes(t)) hit += 1;
  }
  if (hit === 0) return 0;
  return Math.round((hit / tokens.length) * 60);
}

function fuzzySystem(query: string): SystemNode | null {
  const q = query.replace(/\(sim\)/gi, '').trim();
  let best: SystemNode | null = null;
  let bestScore = 0;
  for (const s of SYSTEMS) {
    const score = Math.max(
      scoreMatch(s.id, q),
      scoreMatch(s.shortName, q),
      scoreMatch(s.label, q),
      scoreMatch(s.vendor, q),
    );
    if (score > bestScore) {
      bestScore = score;
      best = s;
    }
  }
  return bestScore >= 40 ? best : null;
}

function fuzzyNarrative(query: string) {
  const q = query.replace(/\(sim\)/gi, '').trim();
  let best = null as (typeof PATH_NARRATIVES)[number] | null;
  let bestScore = 0;
  for (const n of PATH_NARRATIVES) {
    const score = Math.max(
      scoreMatch(n.id, q),
      scoreMatch(n.title, q),
      scoreMatch(n.problem, q),
      scoreMatch(n.systemsTouched.join(' '), q),
      n.gapId ? scoreMatch(n.gapId, q) : 0,
    );
    if (score > bestScore) {
      bestScore = score;
      best = n;
    }
  }
  return bestScore >= 35 ? best : null;
}

function fuzzyEdge(query: string): SystemEdge | null {
  const q = query.toLowerCase();
  const between = q.match(/between\s+(.+?)\s+and\s+(.+)$/);
  const arrow = q.match(/(.+?)\s+(?:to|→|->)\s+(.+)$/);
  const pair = between ?? arrow;
  if (pair) {
    const a = fuzzySystem(pair[1]);
    const b = fuzzySystem(pair[2]);
    if (a && b) {
      const edge =
        EDGES.find(
          (e) =>
            (e.source === a.id && e.target === b.id) ||
            (e.source === b.id && e.target === a.id),
        ) ?? null;
      if (edge) return edge;
    }
  }
  let best: SystemEdge | null = null;
  let bestScore = 0;
  for (const e of EDGES) {
    const src = SYSTEMS.find((s) => s.id === e.source);
    const tgt = SYSTEMS.find((s) => s.id === e.target);
    const label = `${src?.shortName ?? e.source} ${e.protocol} ${tgt?.shortName ?? e.target}`;
    const score = Math.max(scoreMatch(e.id, q), scoreMatch(e.protocol, q), scoreMatch(label, q));
    if (score > bestScore) {
      bestScore = score;
      best = e;
    }
  }
  return bestScore >= 40 ? best : null;
}

function parseLayers(raw: unknown): GeoLayer[] {
  if (!Array.isArray(raw)) return [];
  const out: GeoLayer[] = [];
  for (const item of raw) {
    const s = String(item).toLowerCase().trim();
    if (s === 'ahn-hospitals' || s.includes('ahn hospital') || s === 'hospitals') {
      out.push('ahn-hospitals');
    } else if (s === 'neighborhood' || s.includes('neighborhood')) {
      out.push('neighborhood');
    } else if (s === 'highmark-hq' || s.includes('hq') || s.includes('highmark')) {
      out.push('highmark-hq');
    } else if (s === 'external' || s.includes('external')) {
      out.push('external');
    } else if (
      s === 'shared' ||
      s.includes('interop') ||
      s.includes('rhapsody') ||
      s.includes('shared')
    ) {
      out.push('shared');
    }
  }
  return [...new Set(out)];
}

function idsForEntity(entity: LegalEntity): string[] {
  return SYSTEMS.filter((s) => s.legalEntity === entity).map((s) => s.id);
}

function mergeEffects(base: MapQueryEffects, next: MapQueryEffects): MapQueryEffects {
  return {
    ...base,
    ...next,
    geoLayers: { ...(base.geoLayers ?? {}), ...(next.geoLayers ?? {}) },
    highlightIds:
      next.highlightIds !== undefined ? next.highlightIds : base.highlightIds,
  };
}

function runOne(call: MapToolCall): { result: MapToolResult; effects: MapQueryEffects } {
  const name = call.name;
  const args = call.args ?? {};

  switch (name) {
    case 'highlight_family': {
      const ids = idsForEntity('family');
      return {
        result: {
          ok: true,
          tool: name,
          message: `${ids.length} family (AHN) systems · SIM`,
        },
        effects: {
          entity: 'family',
          highlightIds: ids,
          clearPath: true,
          pathId: null,
        },
      };
    }
    case 'highlight_external': {
      const ids = idsForEntity('external');
      return {
        result: {
          ok: true,
          tool: name,
          message: `${ids.length} external hubs · SIM`,
        },
        effects: {
          entity: 'external',
          highlightIds: ids,
          clearPath: true,
          pathId: null,
        },
      };
    }
    case 'highlight_payer': {
      const ids = idsForEntity('payer');
      return {
        result: {
          ok: true,
          tool: name,
          message: `${ids.length} payer systems · SIM`,
        },
        effects: {
          entity: 'payer',
          highlightIds: ids,
          clearPath: true,
          pathId: null,
        },
      };
    }
    case 'focus_site': {
      const query = String(args.query ?? '');
      const node = fuzzySystem(query);
      if (!node) {
        return {
          result: { ok: false, tool: name, message: `No site match for “${query}” · SIM` },
          effects: {},
        };
      }
      return {
        result: {
          ok: true,
          tool: name,
          message: `Focused ${node.shortName} · ${node.legalEntity} · SIM`,
        },
        effects: {
          selectedId: node.id,
          highlightIds: [node.id],
          entity: 'all',
          clearPath: true,
          pathId: null,
        },
      };
    }
    case 'show_path': {
      const query = String(args.query ?? '');
      const narrative = fuzzyNarrative(query);
      if (!narrative) {
        return {
          result: { ok: false, tool: name, message: `No path match for “${query}” · SIM` },
          effects: {},
        };
      }
      return {
        result: {
          ok: true,
          tool: name,
          message: `Path: ${narrative.title} · SIM`,
        },
        effects: {
          pathId: narrative.id,
          highlightIds: null,
          selectedId: narrative.nodeIds[0] ?? null,
          entity: 'all',
        },
      };
    }
    case 'filter_layers': {
      const layers = parseLayers(args.layers);
      if (layers.length === 0) {
        return {
          result: { ok: false, tool: name, message: 'No Geo layers recognized · SIM' },
          effects: {},
        };
      }
      const exclusive = Boolean(args.exclusive);
      const geoLayers: Partial<Record<GeoLayer, boolean>> = exclusive
        ? { ...Object.fromEntries(GEO_LAYER_OPTIONS.map((o) => [o.id, false])) }
        : {};
      for (const id of layers) geoLayers[id] = true;
      const labels = layers
        .map((id) => GEO_LAYER_OPTIONS.find((o) => o.id === id)?.label ?? id)
        .join(', ');
      return {
        result: {
          ok: true,
          tool: name,
          message: `Geo layers: ${labels}${exclusive ? ' (only)' : ''} · SIM`,
        },
        effects: { geoLayers },
      };
    }
    case 'count_systems': {
      const entityRaw = String(args.entity ?? 'all').toLowerCase();
      const list =
        entityRaw === 'all' || !entityRaw
          ? SYSTEMS
          : SYSTEMS.filter((s) => s.legalEntity === entityRaw);
      if (entityRaw !== 'all' && !['family', 'external', 'payer', 'shared'].includes(entityRaw)) {
        return {
          result: { ok: false, tool: name, message: `Unknown entity “${entityRaw}” · SIM` },
          effects: {},
        };
      }
      const names = list.map((s) => s.shortName).slice(0, 8);
      const more = list.length > names.length ? ` +${list.length - names.length} more` : '';
      const label = entityRaw === 'all' ? 'systems' : `${entityRaw} systems`;
      return {
        result: {
          ok: true,
          tool: name,
          message: `${list.length} ${label}: ${names.join(', ')}${more} · SIM`,
        },
        effects:
          entityRaw !== 'all'
            ? {
                entity: entityRaw as LegalEntity,
                highlightIds: list.map((s) => s.id),
              }
            : {},
      };
    }
    case 'explain_edge': {
      const query = String(args.query ?? '');
      const edge = fuzzyEdge(query);
      if (!edge) {
        return {
          result: { ok: false, tool: name, message: `No edge match for “${query}” · SIM` },
          effects: {},
        };
      }
      const src = SYSTEMS.find((s) => s.id === edge.source);
      const tgt = SYSTEMS.find((s) => s.id === edge.target);
      const blockers =
        edge.blockers.length > 0 ? ` Blockers: ${edge.blockers.slice(0, 2).join('; ')}.` : '';
      return {
        result: {
          ok: true,
          tool: name,
          message: `${src?.shortName ?? edge.source} → ${tgt?.shortName ?? edge.target}: ${edge.protocol} (${edge.status}).${blockers} · SIM`,
        },
        effects: {
          highlightIds: [edge.source, edge.target],
          selectedId: edge.source,
        },
      };
    }
    case 'what_is': {
      const query = String(args.query ?? '');
      const node = fuzzySystem(query);
      if (!node) {
        return {
          result: { ok: false, tool: name, message: `No system match for “${query}” · SIM` },
          effects: {},
        };
      }
      const blurb =
        node.description.length > 160
          ? `${node.description.slice(0, 157)}…`
          : node.description;
      return {
        result: {
          ok: true,
          tool: name,
          message: `${node.shortName}: ${blurb}`,
        },
        effects: {
          selectedId: node.id,
          highlightIds: [node.id],
        },
      };
    }
    case 'clear': {
      return {
        result: { ok: true, tool: name, message: 'Cleared map query · SIM' },
        effects: {
          entity: 'all',
          dataClass: 'all',
          region: 'all',
          highlightIds: null,
          selectedId: null,
          clearPath: true,
          pathId: null,
          resetGeoLayers: true,
          geoLayers: { ...DEFAULT_GEO_LAYERS },
        },
      };
    }
    default: {
      const exhaustive: never = name;
      return {
        result: { ok: false, tool: exhaustive, message: 'Unknown tool · SIM' },
        effects: {},
      };
    }
  }
}

/** Execute a plan; only successful tools contribute to HUD honesty. */
export function executeMapTools(plan: MapQueryPlan): MapToolExecution {
  if (plan.unmatched || plan.tools.length === 0) {
    return {
      results: [],
      effects: {},
      hud: plan.unmatched
        ? 'No map tool matched — try an example chip · SIM'
        : 'Nothing to run · SIM',
    };
  }

  let effects: MapQueryEffects = {};
  const results: MapToolResult[] = [];

  for (const call of plan.tools) {
    const { result, effects: next } = runOne(call);
    results.push(result);
    if (result.ok) {
      effects = mergeEffects(effects, next);
      if (call.name === 'show_path') break;
    }
  }

  const succeeded = results.filter((r) => r.ok);
  const failed = results.filter((r) => !r.ok);
  let hud: string | null = null;
  if (succeeded.length > 0) {
    hud = succeeded.map((r) => r.message).join(' · ');
  } else if (failed.length > 0) {
    hud = failed.map((r) => r.message).join(' · ');
  }

  return { results, effects, hud };
}
