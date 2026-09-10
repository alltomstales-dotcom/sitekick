import { useEffect, useMemo, useState } from 'react';
import {
  SYSTEMS,
  EDGES,
  DATA_CLASS_OPTIONS,
  ENTITY_OPTIONS,
  REGION_OPTIONS,
} from '../data/systems';
import type { DataClass, LegalEntity, PathNarrative, Region, SystemEdge, SystemNode } from '../data/types';
import { NodeDetailDrawer } from './NodeDetailDrawer';
import { X } from 'lucide-react';

const ENTITY_COLOR: Record<LegalEntity, string> = {
  family: '#10b981',
  external: '#f59e0b',
  payer: '#3b82f6',
  shared: '#a78bfa',
};

const NODE_W = 148;
const NODE_H = 64;

/** Absolute canvas positions — two provider lanes + shared + payer */
const LAYOUT: Record<string, { x: number; y: number }> = {
  // Group A — Highmark Family (AHN) lane
  'ahn-hub': { x: 48, y: 56 },
  'ahn-agh': { x: 48, y: 140 },
  'ahn-westpenn': { x: 220, y: 140 },
  'ahn-forbes': { x: 392, y: 140 },
  'ahn-jefferson': { x: 48, y: 220 },
  'ahn-stvincent': { x: 220, y: 220 },
  'ahn-wexford': { x: 392, y: 220 },
  'ahn-beaver': { x: 48, y: 300 },
  'ahn-sewickley': { x: 220, y: 300 },

  // Group B — External Network lane
  'ext-hub': { x: 48, y: 460 },
  upmc: { x: 48, y: 544 },
  'independence-hs': { x: 220, y: 544 },
  'penn-state': { x: 392, y: 544 },
  wellspan: { x: 48, y: 624 },
  'tower-health': { x: 220, y: 624 },

  // Shared spine + Axon
  mpi: { x: 620, y: 160 },
  rhapsody: { x: 620, y: 280 },
  'rhapsody-axon': { x: 720, y: 200 },
  'edw-rwd': { x: 620, y: 400 },
  'rhapsody-edge': { x: 820, y: 280 },
  'axon-connect': { x: 920, y: 200 },
  'hie-gw': { x: 820, y: 420 },

  // Payer
  'hmk-claims': { x: 1040, y: 80 },
  'hmk-elig': { x: 1040, y: 180 },
  'prior-auth': { x: 1040, y: 300 },
  'payer-portal': { x: 1040, y: 420 },
};

const CANVAS_W = 1280;
const CANVAS_H = 780;

/** Lane bands drawn behind nodes */
const LANES = [
  {
    id: 'family',
    label: 'Highmark Family (AHN)',
    x: 24,
    y: 28,
    w: 540,
    h: 360,
    stroke: '#10b981',
    fill: 'rgba(16, 185, 129, 0.06)',
  },
  {
    id: 'external',
    label: 'External Network',
    x: 24,
    y: 432,
    w: 540,
    h: 300,
    stroke: '#f59e0b',
    fill: 'rgba(245, 158, 11, 0.06)',
  },
] as const;

const AHN_MAPPED_HOSPITAL_IDS = [
  'ahn-agh',
  'ahn-westpenn',
  'ahn-forbes',
  'ahn-jefferson',
  'ahn-stvincent',
  'ahn-wexford',
  'ahn-beaver',
  'ahn-sewickley',
] as const;

function edgeStroke(status: SystemEdge['status']): string {
  if (status === 'active') return '#34d399';
  if (status === 'degraded' || status === 'constrained') return '#fbbf24';
  return '#f87171';
}

function nodeCenter(id: string): { x: number; y: number } {
  const p = LAYOUT[id] ?? { x: 100, y: 100 };
  return { x: p.x + NODE_W / 2, y: p.y + NODE_H / 2 };
}

function edgePath(sourceId: string, targetId: string): string {
  const s = nodeCenter(sourceId);
  const t = nodeCenter(targetId);
  const dx = Math.abs(t.x - s.x);
  const curve = Math.min(120, Math.max(40, dx * 0.35));
  const sx = s.x;
  const sy = s.y;
  const tx = t.x;
  const ty = t.y;
  return `M ${sx} ${sy} C ${sx + curve} ${sy}, ${tx - curve} ${ty}, ${tx} ${ty}`;
}

function edgeMidpoint(sourceId: string, targetId: string): { x: number; y: number } {
  const s = nodeCenter(sourceId);
  const t = nodeCenter(targetId);
  return { x: (s.x + t.x) / 2, y: (s.y + t.y) / 2 - 8 };
}

interface Props {
  activePath: PathNarrative | null;
  onClearPath: () => void;
  /** Nodes confirmed via Day-1 Interview answers */
  interviewedNodes?: Set<string>;
  /** Edges confirmed via Day-1 Interview answers */
  interviewedEdges?: Set<string>;
}

export function ResidencyMap({
  activePath,
  onClearPath,
  interviewedNodes,
  interviewedEdges,
}: Props) {
  const [dataClass, setDataClass] = useState<DataClass | 'all'>('all');
  const [entity, setEntity] = useState<LegalEntity | 'all'>('all');
  const [region, setRegion] = useState<Region | 'all'>('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const pathNodeSet = useMemo(
    () => (activePath ? new Set(activePath.nodeIds) : null),
    [activePath],
  );
  const pathEdgeSet = useMemo(
    () => (activePath ? new Set(activePath.edgeIds) : null),
    [activePath],
  );

  useEffect(() => {
    if (!activePath) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClearPath();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [activePath, onClearPath]);

  const filteredSystems = useMemo(() => {
    return SYSTEMS.filter((s) => {
      if (entity !== 'all' && s.legalEntity !== entity) return false;
      if (region !== 'all' && s.region !== region) return false;
      if (dataClass !== 'all' && !s.dataClasses.includes(dataClass)) return false;
      return true;
    });
  }, [dataClass, entity, region]);

  const filteredIds = useMemo(
    () => new Set(filteredSystems.map((s) => s.id)),
    [filteredSystems],
  );

  const visibleEdges = useMemo(() => {
    return EDGES.filter((e) => filteredIds.has(e.source) && filteredIds.has(e.target)).filter(
      (e) => dataClass === 'all' || e.dataClasses.includes(dataClass),
    );
  }, [filteredIds, dataClass]);

  const selected = SYSTEMS.find((s) => s.id === selectedId) ?? null;

  return (
    <div className={`sk-map-layout${activePath ? ' path-mode' : ''}`}>
      {activePath ? (
        <div className="sk-path-strip" role="status" aria-live="polite">
          <div className="sk-path-strip-main">
            <div className="sk-path-strip-title">
              <span className="sk-badge">PATH</span>
              <strong>{activePath.title}</strong>
            </div>
            <ol className="sk-path-steps">
              <li>
                <span className="step-label">Problem</span>
                <span className="step-body">{activePath.problem}</span>
              </li>
              <li>
                <span className="step-label">Systems</span>
                <span className="step-body">{activePath.systemsTouched.join(' → ')}</span>
              </li>
              <li>
                <span className="step-label">Residency / access</span>
                <span className="step-body">{activePath.residencyConstraint}</span>
              </li>
              <li>
                <span className="step-label">$$ lever</span>
                <span className="step-body">{activePath.dollarLever}</span>
              </li>
            </ol>
          </div>
          <button type="button" className="sk-btn sk-btn-ghost sk-clear-path" onClick={onClearPath}>
            <X size={15} strokeWidth={2} />
            Clear path
            <kbd>Esc</kbd>
          </button>
        </div>
      ) : null}

      <div className="sk-filters">
        <label>
          Data class
          <select
            value={dataClass}
            onChange={(e) => setDataClass(e.target.value as DataClass | 'all')}
          >
            <option value="all">All</option>
            {DATA_CLASS_OPTIONS.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>
        <label>
          Ownership
          <select
            value={entity}
            onChange={(e) => setEntity(e.target.value as LegalEntity | 'all')}
          >
            <option value="all">All</option>
            {ENTITY_OPTIONS.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>
        <label>
          Region
          <select value={region} onChange={(e) => setRegion(e.target.value as Region | 'all')}>
            <option value="all">All</option>
            {REGION_OPTIONS.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>
        <div className="sk-legend">
          <span>
            <i className="dot family" /> Family (AHN)
          </span>
          <span>
            <i className="dot external" /> External Network
          </span>
          <span>
            <i className="dot payer" /> Payer
          </span>
          <span>
            <i className="dot shared" /> Shared
          </span>
          <span className="sk-legend-sep" aria-hidden>
            |
          </span>
          <span>
            <i className="line active" /> Active
          </span>
          <span>
            <i className="line constrained" /> Constrained
          </span>
          <span>
            <i className="line missing" /> Missing
          </span>
          <span className="sk-legend-sep" aria-hidden>
            |
          </span>
          <span>
            <i className="conf-assumed" /> Assumed
          </span>
          <span>
            <i className="conf-interviewed" /> Interviewed
          </span>
        </div>
      </div>

      <div className="sk-map-stage">
        <div className="sk-map-scroll">
          <div className="sk-map-canvas" style={{ width: CANVAS_W, height: CANVAS_H }}>
            <svg
              className="sk-map-edges"
              width={CANVAS_W}
              height={CANVAS_H}
              viewBox={`0 0 ${CANVAS_W} ${CANVAS_H}`}
              aria-hidden
            >
              <defs>
                <marker
                  id="arrow-active"
                  viewBox="0 0 10 10"
                  refX="9"
                  refY="5"
                  markerWidth="7"
                  markerHeight="7"
                  orient="auto-start-reverse"
                >
                  <path d="M 0 0 L 10 5 L 0 10 z" fill="#34d399" />
                </marker>
                <marker
                  id="arrow-warn"
                  viewBox="0 0 10 10"
                  refX="9"
                  refY="5"
                  markerWidth="7"
                  markerHeight="7"
                  orient="auto-start-reverse"
                >
                  <path d="M 0 0 L 10 5 L 0 10 z" fill="#fbbf24" />
                </marker>
                <marker
                  id="arrow-bad"
                  viewBox="0 0 10 10"
                  refX="9"
                  refY="5"
                  markerWidth="7"
                  markerHeight="7"
                  orient="auto-start-reverse"
                >
                  <path d="M 0 0 L 10 5 L 0 10 z" fill="#f87171" />
                </marker>
                <marker
                  id="arrow-path"
                  viewBox="0 0 10 10"
                  refX="9"
                  refY="5"
                  markerWidth="8"
                  markerHeight="8"
                  orient="auto-start-reverse"
                >
                  <path d="M 0 0 L 10 5 L 0 10 z" fill="#38bdf8" />
                </marker>
                <filter id="path-glow" x="-40%" y="-40%" width="180%" height="180%">
                  <feGaussianBlur stdDeviation="2.5" result="coloredBlur" />
                  <feMerge>
                    <feMergeNode in="coloredBlur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              {LANES.map((lane) => (
                <g key={lane.id} opacity={pathNodeSet ? 0.35 : 0.95}>
                  <rect
                    x={lane.x}
                    y={lane.y}
                    width={lane.w}
                    height={lane.h}
                    rx={12}
                    fill={lane.fill}
                    stroke={lane.stroke}
                    strokeWidth={1.5}
                    strokeDasharray="6 4"
                  />
                  <text
                    x={lane.x + 14}
                    y={lane.y + 20}
                    fill={lane.stroke}
                    fontSize={12}
                    fontWeight={700}
                    fontFamily="system-ui, sans-serif"
                    letterSpacing="0.04em"
                  >
                    {lane.label}
                  </text>
                </g>
              ))}

              {visibleEdges.map((e) => {
                const onPath = pathEdgeSet?.has(e.id) ?? false;
                const dimmed = pathEdgeSet != null && !onPath;
                const stroke = onPath ? '#38bdf8' : edgeStroke(e.status);
                const marker = onPath
                  ? 'url(#arrow-path)'
                  : e.status === 'active'
                    ? 'url(#arrow-active)'
                    : e.status === 'degraded' || e.status === 'constrained'
                      ? 'url(#arrow-warn)'
                      : 'url(#arrow-bad)';
                const mid = edgeMidpoint(e.source, e.target);
                const baseOpacity = e.status === 'missing' ? 0.45 : 0.9;
                const opacity = dimmed ? 0.12 : onPath ? 1 : baseOpacity;
                return (
                  <g
                    key={e.id}
                    opacity={opacity}
                    filter={onPath ? 'url(#path-glow)' : undefined}
                    className={onPath ? 'sk-edge-on-path' : undefined}
                  >
                    <path
                      d={edgePath(e.source, e.target)}
                      fill="none"
                      stroke={stroke}
                      strokeWidth={onPath ? 3.25 : interviewedEdges?.has(e.id) ? 2.35 : 1.75}
                      markerEnd={marker}
                      strokeDasharray={
                        e.status === 'missing' || e.status === 'broken'
                          ? '5 4'
                          : interviewedEdges != null && !interviewedEdges.has(e.id)
                            ? '4 3'
                            : undefined
                      }
                      opacity={
                        interviewedEdges != null && !interviewedEdges.has(e.id) && !onPath
                          ? 0.55
                          : undefined
                      }
                    />
                    <rect
                      x={mid.x - Math.min(54, e.protocol.length * 3.2)}
                      y={mid.y - 9}
                      width={Math.min(108, e.protocol.length * 6.4 + 10)}
                      height={16}
                      rx={3}
                      fill="#0f172a"
                      fillOpacity={dimmed ? 0.4 : 0.88}
                    />
                    <text
                      x={mid.x}
                      y={mid.y + 3}
                      textAnchor="middle"
                      fill={onPath ? '#7dd3fc' : '#94a3b8'}
                      fontSize={9}
                      fontFamily="system-ui, sans-serif"
                      fontWeight={onPath ? 700 : 400}
                    >
                      {e.protocol.length > 22 ? `${e.protocol.slice(0, 20)}…` : e.protocol}
                    </text>
                  </g>
                );
              })}
            </svg>

            {filteredSystems.map((s: SystemNode) => {
              const pos = LAYOUT[s.id] ?? { x: 100, y: 100 };
              const isSelected = selectedId === s.id;
              const onPath = pathNodeSet?.has(s.id) ?? false;
              const dimmed = pathNodeSet != null && !onPath;
              const rosterMore =
                s.id === 'ahn-hub' && s.hospitalList
                  ? s.hospitalList.length -
                    AHN_MAPPED_HOSPITAL_IDS.filter((id) => filteredIds.has(id)).length
                  : 0;
              const interviewed = interviewedNodes?.has(s.id) ?? false;
              const assumed = interviewedNodes != null && !interviewed;
              return (
                <button
                  key={s.id}
                  type="button"
                  className={`sk-flow-node entity-${s.legalEntity}${isSelected ? ' selected' : ''}${onPath ? ' on-path' : ''}${dimmed ? ' dimmed' : ''}${interviewed ? ' interviewed' : ''}${assumed ? ' assumed' : ''}`}
                  style={{
                    left: pos.x,
                    top: pos.y,
                    width: NODE_W,
                    borderColor: onPath
                      ? '#38bdf8'
                      : interviewed
                        ? '#34d399'
                        : ENTITY_COLOR[s.legalEntity],
                    borderStyle: assumed ? 'dashed' : 'solid',
                  }}
                  onClick={() => setSelectedId(s.id)}
                  aria-pressed={isSelected}
                  title={s.label}
                >
                  <div
                    className="sk-flow-node-accent"
                    style={{
                      background: onPath
                        ? '#38bdf8'
                        : interviewed
                          ? '#34d399'
                          : ENTITY_COLOR[s.legalEntity],
                    }}
                  />
                  <div className="sk-flow-node-title">
                    {s.shortName}
                    {interviewed ? (
                      <span className="sk-interviewed-badge" title="Confirmed in Day-1 Interview">
                        ✓
                      </span>
                    ) : assumed ? (
                      <span className="sk-assumed-badge" title="Assumed — not yet interviewed">
                        ?
                      </span>
                    ) : null}
                  </div>
                  <div className="sk-flow-node-meta">
                    {s.legalEntity} · {s.region}
                  </div>
                  <div className="sk-flow-node-residency" title={`${s.hosting} · ${s.residency}`}>
                    {s.residency.length > 28 ? `${s.residency.slice(0, 26)}…` : s.residency}
                  </div>
                  {rosterMore > 0 ? (
                    <div className="sk-flow-node-cue">+{rosterMore} more in roster</div>
                  ) : null}
                </button>
              );
            })}
          </div>
        </div>
        <NodeDetailDrawer node={selected} edges={EDGES} onClose={() => setSelectedId(null)} />
      </div>
    </div>
  );
}
