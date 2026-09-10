import type { SystemNode, SystemEdge } from '../data/types';
import { X } from 'lucide-react';

interface Props {
  node: SystemNode | null;
  edges: SystemEdge[];
  onClose: () => void;
}

export function NodeDetailDrawer({ node, edges, onClose }: Props) {
  if (!node) return null;

  const related = edges.filter((e) => e.source === node.id || e.target === node.id);

  return (
    <aside className="sk-drawer" aria-label="System detail">
      <div className="sk-drawer-head">
        <div>
          <h2>{node.label}</h2>
          <p className="sk-muted">{node.vendor}</p>
        </div>
        <button className="sk-icon-btn" onClick={onClose} aria-label="Close">
          <X size={18} />
        </button>
      </div>

      <div className="sk-drawer-body">
        <dl className="sk-dl">
          <div>
            <dt>Ownership</dt>
            <dd>
              <span className={`sk-pill entity-${node.legalEntity}`}>{node.legalEntity}</span>
            </dd>
          </div>
          <div>
            <dt>Region</dt>
            <dd>{node.region}</dd>
          </div>
          <div>
            <dt>Hosting</dt>
            <dd>{node.hosting}</dd>
          </div>
          <div>
            <dt>Residency</dt>
            <dd>{node.residency}</dd>
          </div>
          <div>
            <dt>Auth</dt>
            <dd>{node.auth}</dd>
          </div>
          <div>
            <dt>Confidence</dt>
            <dd>
              <span className={`sk-pill conf-${node.confidence}`}>{node.confidence}</span>
            </dd>
          </div>
        </dl>

        <section>
          <h3>Description</h3>
          <p>{node.description}</p>
        </section>

        {node.hospitalList && node.hospitalList.length > 0 && (
          <section>
            <h3>Full hospital roster ({node.hospitalList.length})</h3>
            <ul className="sk-list">
              {node.hospitalList.map((h) => (
                <li key={h}>{h}</li>
              ))}
            </ul>
          </section>
        )}

        <section>
          <h3>Data classes</h3>
          <div className="sk-chip-row">
            {node.dataClasses.map((c) => (
              <span key={c} className="sk-chip">
                {c}
              </span>
            ))}
          </div>
        </section>

        <section>
          <h3>Access paths</h3>
          <ul className="sk-list">
            {node.accessPaths.map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ul>
        </section>

        <section>
          <h3>Connected paths ({related.length})</h3>
          <ul className="sk-edge-list">
            {related.map((e) => (
              <li key={e.id} className={`edge-${e.status}`}>
                <div className="edge-line">
                  <strong>
                    {e.source === node.id ? '→' : '←'}{' '}
                    {e.source === node.id ? e.target : e.source}
                  </strong>
                  <span className={`sk-pill status-${e.status}`}>{e.status}</span>
                </div>
                <div className="sk-muted">{e.protocol}</div>
                {e.blockers.length > 0 && (
                  <div className="sk-warn">Blockers: {e.blockers.join('; ')}</div>
                )}
                {e.dollarLevers.length > 0 && (
                  <div className="sk-money">$$: {e.dollarLevers.join('; ')}</div>
                )}
              </li>
            ))}
          </ul>
        </section>
      </div>
    </aside>
  );
}
