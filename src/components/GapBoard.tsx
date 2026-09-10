import { GAPS, SYSTEMS } from '../data/systems';

function fmtUsd(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n}`;
}

export function GapBoard() {
  const total = GAPS.reduce((s, g) => s + g.impactUsd, 0);

  return (
    <div className="sk-gaps">
      <div className="sk-gaps-hero">
        <div>
          <h2>Ranked integration gaps</h2>
          <p className="sk-muted">
            Missing / broken / constrained paths with estimated $ impact hypotheses (SIM only).
          </p>
        </div>
        <div className="sk-gaps-total">
          <span className="label">Total hypothesized impact</span>
          <span className="value">{fmtUsd(total)}</span>
        </div>
      </div>

      <ol className="sk-gap-list">
        {GAPS.map((g) => {
          const [a, b] = g.systems;
          const sa = SYSTEMS.find((s) => s.id === a);
          const sb = SYSTEMS.find((s) => s.id === b);
          return (
            <li key={g.id} className={`sk-gap-card sev-${g.severity}`}>
              <div className="sk-gap-rank">#{g.rank}</div>
              <div className="sk-gap-main">
                <div className="sk-gap-title-row">
                  <h3>{g.title}</h3>
                  <span className={`sk-pill sev-${g.severity}`}>{g.severity}</span>
                </div>
                <div className="sk-gap-path">
                  {sa?.shortName ?? a} <span>→</span> {sb?.shortName ?? b}
                </div>
                <p>{g.hypothesis}</p>
                <div className="sk-chip-row">
                  {g.blockers.map((b) => (
                    <span key={b} className="sk-chip warn">
                      {b}
                    </span>
                  ))}
                </div>
              </div>
              <div className="sk-gap-impact">
                <span className="label">Est. impact</span>
                <span className="value">{fmtUsd(g.impactUsd)}</span>
                <span className="unit">/ yr (hyp.)</span>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
