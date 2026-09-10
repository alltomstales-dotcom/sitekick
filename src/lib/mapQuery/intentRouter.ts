
/**
 * V0 client-side intent router: natural language → MapQueryPlan (JSON tool calls).
 * Replace routeMapQuery() with an LLM that returns the same MapQueryPlan shape
 * (see systemPrompt.ts). Tool execution stays in execute.ts.
 */

import type { MapQueryPlan } from './types';

function normalize(q: string): string {
  return q.trim().toLowerCase().replace(/[?.!,]+$/g, '').replace(/\s+/g, ' ');
}

function extractAfter(patterns: RegExp[], text: string): string | null {
  for (const re of patterns) {
    const m = text.match(re);
    if (m?.[1]) return m[1].trim();
  }
  return null;
}

/** Map a free-text utterance to zero or more tool calls. */
export function routeMapQuery(utterance: string): MapQueryPlan {
  const q = normalize(utterance);
  if (!q) {
    return { interpretation: 'Empty query', tools: [], unmatched: true };
  }

  // clear
  if (/^(clear|reset|start over|clear (the )?map|clear (highlights?|path|filters?))$/.test(q)) {
    return { interpretation: 'Clear map query state', tools: [{ name: 'clear' }] };
  }

  // count_systems
  if (/\b(how many|count|number of)\b/.test(q)) {
    let entity = 'all';
    if (/\bhow many external\b|\bexternal systems?\b/.test(q) || /\bexternal\b/.test(q)) {
      entity = 'external';
    } else if (/\bhow many (ahn )?family\b|\bhow many ahn\b|\bfamily\b|\bahn\b/.test(q)) {
      entity = 'family';
    } else if (/\bpayer\b|\bhighmark\b/.test(q)) {
      entity = 'payer';
    } else if (/\bshared\b/.test(q)) {
      entity = 'shared';
    }
    return {
      interpretation: `Count ${entity === 'all' ? 'all' : entity} systems`,
      tools: [{ name: 'count_systems', args: { entity } }],
    };
  }

  // highlight ownership bands
  if (
    /\b(show|highlight|focus|filter)\b.*\b(ahn )?family\b/.test(q) ||
    /\bshow ahn\b/.test(q) ||
    /^ahn family$/.test(q) ||
    /\bhighlight ahn\b/.test(q)
  ) {
    return {
      interpretation: 'Highlight Highmark Family (AHN)',
      tools: [{ name: 'highlight_family' }],
    };
  }
  if (/\b(show|highlight|focus)\b.*\bexternal\b/.test(q) || /\bhighlight external\b/.test(q)) {
    return {
      interpretation: 'Highlight External Network',
      tools: [{ name: 'highlight_external' }],
    };
  }
  if (/\b(show|highlight|focus)\b.*\bpayer\b/.test(q) || /\bhighlight (highmark )?payer\b/.test(q)) {
    return {
      interpretation: 'Highlight Highmark payer systems',
      tools: [{ name: 'highlight_payer' }],
    };
  }

  // filter_layers (Geo)
  if (
    /\b(filter|show|toggle|hide|only)\b.*\b(layer|layers|hospitals?|neighborhood|hq|external)\b/.test(
      q,
    ) ||
    /\bahn hospitals?\b/.test(q) ||
    /\bneighborhood (hospitals?|layer)?\b/.test(q) ||
    (/\b(highmark )?hq\b/.test(q) && /\b(show|filter|only|layer)\b/.test(q))
  ) {
    const layers: string[] = [];
    if (/\bahn hospitals?\b|\bfamily hospitals?\b/.test(q)) layers.push('ahn-hospitals');
    if (/\bneighborhood\b/.test(q)) layers.push('neighborhood');
    if (/\b(highmark )?hq\b|\bfifth ave\b/.test(q)) layers.push('highmark-hq');
    if (/\bexternal\b/.test(q) && !/\bexternal systems?\b/.test(q)) layers.push('external');
    if (layers.length === 0 && /\bahn hospitals?\b/.test(q)) layers.push('ahn-hospitals');
    if (layers.length > 0) {
      const exclusive = /\bonly\b|\bjust\b/.test(q);
      return {
        interpretation: `Filter Geo layers: ${layers.join(', ')}`,
        tools: [{ name: 'filter_layers', args: { layers, exclusive } }],
      };
    }
  }

  // show_path — narratives / gap keywords
  if (/\bpath\b/.test(q) || /\badt\b/.test(q) || /\bprior auth\b/.test(q) && /\bhighlight\b/.test(q)) {
    const pathQuery =
      extractAfter(
        [
          /(?:highlight|show|open|find)\s+(?:the\s+)?(.+?)(?:\s+path)?$/,
          /path\s+(?:for\s+|to\s+)?(.+)$/,
        ],
        q,
      ) ?? q;
    return {
      interpretation: `Show path: ${pathQuery}`,
      tools: [{ name: 'show_path', args: { query: pathQuery } }],
    };
  }

  // what_is / explain
  if (/^(what('s| is| are)|whats|who is|tell me about|describe)\b/.test(q)) {
    const subject =
      extractAfter(
        [/^(?:what(?:'s| is| are)|whats|who is|tell me about|describe)\s+(.+)$/],
        q,
      ) ?? q;
    if (/\bedge\b|\blink\b|\bconnection\b|\bbetween\b/.test(q)) {
      return {
        interpretation: `Explain edge: ${subject}`,
        tools: [{ name: 'explain_edge', args: { query: subject } }],
      };
    }
    return {
      interpretation: `What is: ${subject}`,
      tools: [{ name: 'what_is', args: { query: subject } }],
    };
  }

  if (/\bexplain\b.*\b(edge|link|connection)\b/.test(q) || /\bedge between\b/.test(q)) {
    const subject =
      extractAfter([/explain(?:\s+the)?\s+edge(?:\s+between)?\s+(.+)$/, /edge between\s+(.+)$/], q) ??
      q;
    return {
      interpretation: `Explain edge: ${subject}`,
      tools: [{ name: 'explain_edge', args: { query: subject } }],
    };
  }

  // focus_site — where is / find / go to / focus
  if (
    /^(where is|where's|find|go to|focus|select|open|locate)\b/.test(q) ||
    /\bwhere is\b/.test(q)
  ) {
    const subject =
      extractAfter(
        [
          /^(?:where(?:'s| is)|find|go to|focus(?:\s+on)?|select|open|locate)\s+(.+)$/,
          /where is\s+(.+)$/,
        ],
        q,
      ) ?? q;
    return {
      interpretation: `Focus site: ${subject}`,
      tools: [{ name: 'focus_site', args: { query: subject } }],
    };
  }

  // Bare site name fallback → focus_site (short queries)
  if (q.split(/\s+/).length <= 5 && !/\b(how|why|when)\b/.test(q)) {
    if (
      /\b(west penn|agh|forbes|jefferson|wexford|upmc|axon|rhapsody|mpi|hie|wellspan|tower|independence|penn state|highmark|prior auth)\b/.test(
        q,
      )
    ) {
      return {
        interpretation: `Focus site: ${q}`,
        tools: [{ name: 'focus_site', args: { query: q } }],
      };
    }
  }

  // Last chance: show_path then focus_site
  if (/\b(upmc|independence|prior auth|mpi|hie|edw|axon)\b/.test(q)) {
    return {
      interpretation: `Try path/site for: ${q}`,
      tools: [
        { name: 'show_path', args: { query: q } },
        { name: 'focus_site', args: { query: q } },
      ],
    };
  }

  return {
    interpretation: 'No matching map tool',
    tools: [],
    unmatched: true,
  };
}
