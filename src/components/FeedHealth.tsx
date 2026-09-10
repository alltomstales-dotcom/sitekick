import { useEffect, useState } from 'react';
import { SYSTEMS } from '../data/systems';
import type { FeedMetric } from '../data/types';

const FEED_SYSTEMS = [
  'ahn-hub',
  'ahn-agh',
  'ext-hub',
  'upmc',
  'hmk-claims',
  'hmk-elig',
  'rhapsody',
  'rhapsody-edge',
  'mpi',
  'hie-gw',
  'edw-rwd',
  'prior-auth',
  'penn-state',
  'wellspan',
  'tower-health',
];

function seedMetrics(): FeedMetric[] {
  return FEED_SYSTEMS.map((systemId) => {
    const baseRate = 40 + Math.random() * 400;
    const lag = Math.floor(Math.random() * 8000);
    const errors = Math.random() > 0.85 ? Math.floor(Math.random() * 12) : 0;
    const lastSeenSec = Math.floor(Math.random() * 8);
    let status: FeedMetric['status'] = 'healthy';
    if (errors > 5 || lag > 5000) status = 'critical';
    else if (errors > 0 || lag > 2000) status = 'warning';
    return {
      systemId,
      messageRate: Math.round(baseRate),
      lagMs: lag,
      lastSeenSec,
      errors,
      status,
    };
  });
}

function tick(prev: FeedMetric[]): FeedMetric[] {
  return prev.map((m) => {
    const delta = (Math.random() - 0.45) * 40;
    const messageRate = Math.max(5, Math.round(m.messageRate + delta));
    const lagMs = Math.max(0, Math.round(m.lagMs + (Math.random() - 0.5) * 600));
    const errors =
      Math.random() > 0.92
        ? m.errors + Math.floor(Math.random() * 3)
        : Math.max(0, m.errors - (Math.random() > 0.7 ? 1 : 0));
    const lastSeenSec = Math.random() > 0.3 ? 0 : Math.min(30, m.lastSeenSec + 2);
    let status: FeedMetric['status'] = 'healthy';
    if (errors > 5 || lagMs > 5000 || lastSeenSec > 15) status = 'critical';
    else if (errors > 0 || lagMs > 2000 || lastSeenSec > 6) status = 'warning';
    return { systemId: m.systemId, messageRate, lagMs, errors, lastSeenSec, status };
  });
}

export function FeedHealth() {
  const [metrics, setMetrics] = useState<FeedMetric[]>(seedMetrics);
  const [live, setLive] = useState(true);
  const [lastTick, setLastTick] = useState(() => new Date());

  useEffect(() => {
    if (!live) return;
    const id = window.setInterval(
      () => {
        setMetrics((m) => tick(m));
        setLastTick(new Date());
      },
      2000 + Math.floor(Math.random() * 1000),
    );
    return () => clearInterval(id);
  }, [live]);

  const healthy = metrics.filter((m) => m.status === 'healthy').length;
  const warning = metrics.filter((m) => m.status === 'warning').length;
  const critical = metrics.filter((m) => m.status === 'critical').length;

  return (
    <div className="sk-feeds">
      <div className="sk-feeds-bar">
        <div className="sk-live">
          <span className={`sk-live-dot ${live ? 'on' : ''}`} />
          {live ? 'LIVE' : 'PAUSED'} · tick {lastTick.toLocaleTimeString()}
        </div>
        <div className="sk-feed-summary">
          <span className="ok">{healthy} healthy</span>
          <span className="warn">{warning} warning</span>
          <span className="crit">{critical} critical</span>
        </div>
        <button className="sk-btn" onClick={() => setLive((v) => !v)}>
          {live ? 'Pause' : 'Resume'}
        </button>
      </div>

      <div className="sk-feed-grid">
        {metrics.map((m) => {
          const sys = SYSTEMS.find((s) => s.id === m.systemId);
          return (
            <article key={m.systemId} className={`sk-feed-card status-${m.status}`}>
              <header>
                <h3>{sys?.shortName ?? m.systemId}</h3>
                <span className={`sk-pill status-${m.status}`}>{m.status}</span>
              </header>
              <dl>
                <div>
                  <dt>Msg / min</dt>
                  <dd>{m.messageRate.toLocaleString()}</dd>
                </div>
                <div>
                  <dt>Lag</dt>
                  <dd>{m.lagMs < 1000 ? `${m.lagMs} ms` : `${(m.lagMs / 1000).toFixed(1)} s`}</dd>
                </div>
                <div>
                  <dt>Last seen</dt>
                  <dd>{m.lastSeenSec === 0 ? 'now' : `${m.lastSeenSec}s ago`}</dd>
                </div>
                <div>
                  <dt>Errors</dt>
                  <dd className={m.errors > 0 ? 'bad' : ''}>{m.errors}</dd>
                </div>
              </dl>
              <div className="sk-spark">
                <div
                  className="sk-spark-bar"
                  style={{ width: `${Math.min(100, (m.messageRate / 450) * 100)}%` }}
                />
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
