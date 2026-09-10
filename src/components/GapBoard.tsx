import { GAPS, SYSTEMS } from '../data/systems';
import { getNarrativeForGap, PATH_NARRATIVES } from '../data/narratives';
import { downloadExecBriefMarkdown, openExecBriefPrint } from '../lib/execBrief';
import { FileDown, Printer, Route } from 'lucide-react';

function fmtUsd(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n}`;
}

interface Props {
  onActivatePath: (narrativeId: string) => void;
  activePathId: string | null;
}

export function GapBoard({ onActivatePath, activePathId }: Props) {
  const total = GAPS.reduce((s, g) => s + g.impactUsd, 0);

  return (
    <div className="sk-gaps">
      <div className="sk-gaps-hero">
        <div>
          <h2>Ranked integration gaps</h2>
          <p className="sk-muted">
            Missing / broken / constrained paths with estimated $ impact hypotheses (SIM only).
            Click a gap to walk the path on the Residency Map.
          </p>
        </div>
        <div className="sk-gaps-hero-actions">
          <div className="sk-gaps-total">
            <span className="label">Total hypothesized impact</span>
            <span className="value">{fmtUsd(total)}</span>
          </div>
          <div className="sk-export-group">
            <button
              type="button"
              className="sk-btn sk-btn-primary"
              onClick={() => openExecBriefPrint()}
            >
              <Printer size={15} strokeWidth={2} />
              Export exec brief
            </button>
            <button
              type="button"
              className="sk-btn sk-btn-ghost"
              onClick={() => downloadExecBriefMarkdown()}
            >
              <FileDown size={15} strokeWidth={2} />
              .md
            </button>
          </div>
        </div>
      </div>

      <ol className="sk-gap-list">
        {GAPS.map((g) => {
          const [a, b] = g.systems;
          const sa = SYSTEMS.find((s) => s.id === a);
          const sb = SYSTEMS.find((s) => s.id === b);
          const narrative = getNarrativeForGap(g.id);
          const isActive = narrative != null && activePathId === narrative.id;
          const hasPath = narrative != null;
          return (
            <li key={g.id}>
              <button
                type="button"
                className={`sk-gap-card sev-${g.severity}${isActive ? ' path-active' : ''}${hasPath ? ' clickable' : ''}`}
                onClick={() => {
                  if (narrative) onActivatePath(narrative.id);
                }}
                disabled={!hasPath}
                title={hasPath ? 'Show path on Residency Map' : 'No curated path narrative'}
              >
                <div className="sk-gap-rank">#{g.rank}</div>
                <div className="sk-gap-main">
                  <div className="sk-gap-title-row">
                    <h3>{g.title}</h3>
                    <span className={`sk-pill sev-${g.severity}`}>{g.severity}</span>
                    {hasPath ? (
                      <span className="sk-pill path-cue">
                        <Route size={12} strokeWidth={2.5} />
                        View path
                      </span>
                    ) : (
                      <span className="sk-pill path-none">No curated path</span>
                    )}
                  </div>
                  <div className="sk-gap-path">
                    {sa?.shortName ?? a} <span>→</span> {sb?.shortName ?? b}
                  </div>
                  <p>{g.hypothesis}</p>
                  <div className="sk-chip-row">
                    {g.blockers.map((blk) => (
                      <span key={blk} className="sk-chip warn">
                        {blk}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="sk-gap-impact">
                  <span className="label">Est. impact</span>
                  <span className="value">{fmtUsd(g.impactUsd)}</span>
                  <span className="unit">/ yr (hyp.)</span>
                </div>
              </button>
            </li>
          );
        })}
      </ol>

      <div className="sk-demo-narratives">
        <h3>Demo path narratives</h3>
        <p className="sk-muted">
          Curated stories ({PATH_NARRATIVES.length}) — also reachable from linked gaps above.
        </p>
        <div className="sk-demo-narrative-row">
          {PATH_NARRATIVES.map((n) => (
            <button
              key={n.id}
              type="button"
              className={`sk-demo-chip${activePathId === n.id ? ' active' : ''}`}
              onClick={() => onActivatePath(n.id)}
            >
              {n.title}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
