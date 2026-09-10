import { useMemo, useState } from 'react';
import { SYSTEMS, getReachability } from '../data/systems';
import type { Reachability } from '../data/types';

const LABEL: Record<Reachability, string> = {
  path: 'Path',
  constrained: 'Constrained',
  none: 'None',
  unknown: 'Unknown',
};

export function AccessMatrix() {
  const [hover, setHover] = useState<{ r: string; c: string; v: Reachability } | null>(null);

  const systems = useMemo(() => SYSTEMS, []);

  return (
    <div className="sk-matrix-wrap">
      <div className="sk-matrix-legend">
        <span>
          <i className="cell path" /> Path
        </span>
        <span>
          <i className="cell constrained" /> Constrained
        </span>
        <span>
          <i className="cell none" /> None
        </span>
        <span>
          <i className="cell unknown" /> Unknown
        </span>
        {hover && (
          <span className="sk-matrix-hover">
            {SYSTEMS.find((s) => s.id === hover.r)?.shortName} →{' '}
            {SYSTEMS.find((s) => s.id === hover.c)?.shortName}: <strong>{LABEL[hover.v]}</strong>
          </span>
        )}
      </div>
      <div className="sk-matrix-scroll">
        <table className="sk-matrix">
          <thead>
            <tr>
              <th className="corner">From \\ To</th>
              {systems.map((c) => (
                <th key={c.id} title={c.label}>
                  <span>{c.shortName}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {systems.map((row) => (
              <tr key={row.id}>
                <th title={row.label}>{row.shortName}</th>
                {systems.map((col) => {
                  const v = getReachability(row.id, col.id);
                  return (
                    <td
                      key={col.id}
                      className={`cell ${v} ${row.id === col.id ? 'self' : ''}`}
                      title={`${row.shortName} → ${col.shortName}: ${LABEL[v]}`}
                      onMouseEnter={() => setHover({ r: row.id, c: col.id, v })}
                      onMouseLeave={() => setHover(null)}
                    >
                      <span className="sr-only">{LABEL[v]}</span>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="sk-footnote">
        Heat map of systems × reachability (direct or 1-hop via integration hubs). Synthetic survey
        data only.
      </p>
    </div>
  );
}
