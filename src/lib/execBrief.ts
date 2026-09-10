import { GAPS, SYSTEMS } from '../data/systems';

function fmtUsd(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n}`;
}

export function getExecSnapshot() {
  const family = SYSTEMS.filter((s) => s.legalEntity === 'family').length;
  const external = SYSTEMS.filter((s) => s.legalEntity === 'external').length;
  const payer = SYSTEMS.filter((s) => s.legalEntity === 'payer').length;
  const shared = SYSTEMS.filter((s) => s.legalEntity === 'shared').length;
  const topGaps = [...GAPS].sort((a, b) => a.rank - b.rank).slice(0, 5);
  const totalImpact = topGaps.reduce((s, g) => s + g.impactUsd, 0);
  return { family, external, payer, shared, topGaps, totalImpact };
}

export function buildExecBriefMarkdown(): string {
  const { family, external, payer, shared, topGaps, totalImpact } = getExecSnapshot();
  const gapLines = topGaps
    .map((g) => {
      const [a, b] = g.systems;
      const sa = SYSTEMS.find((s) => s.id === a)?.shortName ?? a;
      const sb = SYSTEMS.find((s) => s.id === b)?.shortName ?? b;
      return `### ${g.rank}. ${g.title}\n- Path: ${sa} → ${sb}\n- Est. impact: **${fmtUsd(g.impactUsd)}/yr** (${g.severity})\n- Hypothesis: ${g.hypothesis}\n- Blockers: ${g.blockers.join('; ')}`;
    })
    .join('\n\n');

  return `# SiteKick Exec Brief — Highmark Hybrid SIM

**All data is synthetic (SIM).** No PHI, no real credentials, no production endpoints.

## Context
Site Survey Index for a Highmark-like payer + AHN-like provider hybrid network. Forward-deployed integration engineers use this index to locate residency, access constraints, and $$ levers before committing SOW spikes.

## Family vs External snapshot
| Cohort | Systems (SIM) |
|--------|---------------|
| Highmark Family (AHN) | ${family} |
| External Network | ${external} |
| Payer | ${payer} |
| Shared integration | ${shared} |

Top ${topGaps.length} gaps hypothesized impact: **${fmtUsd(totalImpact)}/yr**.

## Top $$ gaps
${gapLines}

## Recommended week-one spike / SOW line
1. **Spike (3–5 days):** Trace AHN family → Prior Auth CRD path end-to-end with **Rhapsody Axon** (embedded agent) to propose HL7v2/FHIR mappings and transform logic; quantify fax/portal TAT vs pilot CRD; draft DTR questionnaire backlog.
2. **SOW line:** "Enable production CRD/DTR for AHN family prior auth using Axon-assisted mapping inside Rhapsody; author **Axon Connect** playbooks (specs/business/security → AI-ready) for top external hubs (UPMC, Independence, Tower/WellSpan); MPI enroll gap analysis for external MRNs."
3. **Tooling:** Week-one recommended stack — **Rhapsody Axon** (Day-1 spike inside engine via chat.axon.rhapsody.health) + **Axon Connect** (external partner/vendor onboarding playbooks). All SIM-labeled in this demo.
4. **Exit criteria:** Ranked path heatmap signed by payer + family ops; Axon mapping assist logged for family routes; Axon Connect playbook stubs for ≥1 external; week-two backlog sized for Edge ACL + MPI match-rate workstream.

## Disclaimer
All figures, systems, and paths in this brief are **synthetic demo data (SIM)** for concept review only. Not for contracting, clinical, or production use.
`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function buildExecBriefHtml(): string {
  const { family, external, payer, shared, topGaps, totalImpact } = getExecSnapshot();
  const gapRows = topGaps
    .map((g) => {
      const [a, b] = g.systems;
      const sa = SYSTEMS.find((s) => s.id === a)?.shortName ?? a;
      const sb = SYSTEMS.find((s) => s.id === b)?.shortName ?? b;
      return `<tr>
        <td class="rank">#${g.rank}</td>
        <td>
          <div class="gap-title">${escapeHtml(g.title)}</div>
          <div class="gap-path">${escapeHtml(sa)} → ${escapeHtml(sb)}</div>
          <div class="gap-hyp">${escapeHtml(g.hypothesis)}</div>
        </td>
        <td class="usd">${fmtUsd(g.impactUsd)}</td>
        <td><span class="sev sev-${g.severity}">${g.severity}</span></td>
      </tr>`;
    })
    .join('\n');

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>SiteKick Exec Brief — Highmark Hybrid SIM</title>
<style>
  :root { color-scheme: light; }
  * { box-sizing: border-box; }
  body {
    font-family: "Segoe UI", system-ui, -apple-system, sans-serif;
    margin: 0; padding: 28px 32px 40px;
    color: #0f172a; background: #fff; font-size: 12.5px; line-height: 1.45;
  }
  h1 { font-size: 20px; margin: 0 0 4px; letter-spacing: -0.02em; }
  h2 { font-size: 13px; margin: 18px 0 8px; text-transform: uppercase; letter-spacing: 0.06em; color: #334155; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; }
  .sub { color: #64748b; margin: 0 0 12px; }
  .badge {
    display: inline-block; font-size: 10px; font-weight: 700; letter-spacing: 0.08em;
    padding: 2px 6px; border-radius: 4px; background: #fef3c7; color: #92400e; border: 1px solid #fcd34d;
    margin-right: 6px; vertical-align: middle;
  }
  .disclaimer {
    background: #fff7ed; border: 1px solid #fdba74; color: #9a3412;
    padding: 8px 10px; border-radius: 6px; margin: 0 0 16px; font-size: 11.5px;
  }
  .grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin-bottom: 8px; }
  .card { border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px 12px; background: #f8fafc; }
  .card .label { font-size: 10px; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b; }
  .card .value { font-size: 22px; font-weight: 700; font-variant-numeric: tabular-nums; }
  .card.family .value { color: #047857; }
  .card.external .value { color: #b45309; }
  .card.payer .value { color: #1d4ed8; }
  .card.shared .value { color: #6d28d9; }
  table { width: 100%; border-collapse: collapse; }
  th, td { text-align: left; padding: 7px 8px; border-bottom: 1px solid #e2e8f0; vertical-align: top; }
  th { font-size: 10px; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b; }
  .rank { font-weight: 700; color: #64748b; width: 36px; }
  .usd { font-weight: 700; color: #047857; white-space: nowrap; font-variant-numeric: tabular-nums; }
  .gap-title { font-weight: 650; }
  .gap-path { font-family: ui-monospace, monospace; font-size: 11px; color: #2563eb; margin: 2px 0; }
  .gap-hyp { color: #475569; font-size: 11.5px; }
  .sev { font-size: 10px; font-weight: 700; text-transform: uppercase; padding: 2px 6px; border-radius: 999px; }
  .sev-critical { background: #fee2e2; color: #b91c1c; }
  .sev-high { background: #ffedd5; color: #c2410c; }
  .sev-medium { background: #fef9c3; color: #a16207; }
  .sev-low { background: #e2e8f0; color: #475569; }
  ol.sow { margin: 6px 0 0; padding-left: 18px; }
  ol.sow li { margin-bottom: 6px; }
  .total { margin-top: 6px; color: #334155; }
  .total strong { color: #047857; }
  @media print {
    body { padding: 12mm; }
    .no-print { display: none !important; }
    a { color: inherit; text-decoration: none; }
  }
  .toolbar { margin-bottom: 14px; display: flex; gap: 8px; }
  .toolbar button {
    font: inherit; padding: 6px 12px; border-radius: 6px; border: 1px solid #cbd5e1;
    background: #0f172a; color: #fff; cursor: pointer;
  }
  .toolbar button.secondary { background: #fff; color: #0f172a; }
</style>
</head>
<body>
  <div class="toolbar no-print">
    <button type="button" onclick="window.print()">Print / Save PDF</button>
    <button type="button" class="secondary" onclick="window.close()">Close</button>
  </div>
  <h1><span class="badge">SIM</span>SiteKick Exec Brief — Highmark Hybrid</h1>
  <p class="sub">Site Survey Index · one-pager for week-one spike / SOW alignment</p>
  <div class="disclaimer"><strong>Disclaimer:</strong> All data on this page is synthetic (SIM). No PHI, no real credentials, no production endpoints. Not for contracting or clinical use.</div>

  <h2>Context</h2>
  <p>Highmark-like payer + AHN-like provider hybrid network. This brief summarizes residency cohorts and the top hypothesized $$ integration gaps so leadership can green-light a week-one technical spike.</p>

  <h2>Family vs External snapshot</h2>
  <div class="grid">
    <div class="card family"><div class="label">Family (AHN)</div><div class="value">${family}</div></div>
    <div class="card external"><div class="label">External Network</div><div class="value">${external}</div></div>
    <div class="card payer"><div class="label">Payer</div><div class="value">${payer}</div></div>
    <div class="card shared"><div class="label">Shared</div><div class="value">${shared}</div></div>
  </div>
  <p class="total">Top ${topGaps.length} gaps hypothesized impact: <strong>${fmtUsd(totalImpact)}/yr</strong></p>

  <h2>Top $$ gaps</h2>
  <table>
    <thead><tr><th>#</th><th>Gap / hypothesis</th><th>Est. $/yr</th><th>Sev</th></tr></thead>
    <tbody>
      ${gapRows}
    </tbody>
  </table>

  <h2>Recommended week-one spike / SOW line</h2>
  <ol class="sow">
    <li><strong>Spike (3–5 days):</strong> Trace AHN family → Prior Auth CRD path end-to-end with <strong>Rhapsody Axon</strong> (embedded agent) to propose HL7v2/FHIR mappings and transform logic; quantify fax/portal TAT vs pilot CRD; draft DTR questionnaire backlog.</li>
    <li><strong>SOW line:</strong> Enable production CRD/DTR for AHN family prior auth using Axon-assisted mapping inside Rhapsody; author <strong>Axon Connect</strong> playbooks (specs/business/security → AI-ready) for top external hubs (UPMC, Independence, Tower/WellSpan); MPI enroll gap analysis for external MRNs.</li>
    <li><strong>Tooling:</strong> Week-one recommended stack — <strong>Rhapsody Axon</strong> (Day-1 spike inside engine via chat.axon.rhapsody.health) + <strong>Axon Connect</strong> (external partner/vendor onboarding playbooks). All SIM-labeled in this demo.</li>
    <li><strong>Exit criteria:</strong> Ranked path heatmap signed by payer + family ops; Axon mapping assist logged for family routes; Axon Connect playbook stubs for ≥1 external; week-two backlog sized for Edge ACL + MPI match-rate workstream.</li>
  </ol>

  <h2>Disclaimer</h2>
  <p>All figures, systems, and paths in this brief are <strong>synthetic demo data (SIM)</strong> for concept review only.</p>
</body>
</html>`;
}

export function openExecBriefPrint(): void {
  const html = buildExecBriefHtml();
  const w = window.open('', '_blank', 'noopener,noreferrer,width=900,height=1100');
  if (!w) {
    downloadBlob(html, 'sitekick-exec-brief.html', 'text/html;charset=utf-8');
    return;
  }
  w.document.open();
  w.document.write(html);
  w.document.close();
  w.focus();
  setTimeout(() => {
    try {
      w.print();
    } catch {
      /* ignore */
    }
  }, 250);
}

export function downloadExecBriefMarkdown(): void {
  const md = buildExecBriefMarkdown();
  downloadBlob(md, 'sitekick-exec-brief.md', 'text/markdown;charset=utf-8');
}

function downloadBlob(content: string, filename: string, type: string): void {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
