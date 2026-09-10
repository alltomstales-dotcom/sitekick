import { useMemo, useState } from 'react';
import {
  SYSTEMS,
  EDGES,
  DATA_CLASS_OPTIONS,
  ENTITY_OPTIONS,
  REGION_OPTIONS,
} from '../data/systems';
import type { DataClass, LegalEntity, Region, SystemEdge, SystemNode } from '../data/types';
import { NodeDetailDrawer } from './NodeDetailDrawer';

const ENTITY_COLOR: Record<LegalEntity, string> = {
  payer: '#3b82f6',
  provider: '#10b981',
  shared: '#a78bfa',
};

const NODE_W = 148;
const NODE_H = 56;

/** Absolute canvas positions for Highmark Hybrid SIM systems */
const LAYOUT: Record<string, { x: number; y: number }> = {
  'epic-ehr': { x: 40, y: 40 },
  scheduling: { x: 40, y: 140 },
  'lab-core': { x: 40, y: 240 },
  'pacs-dicom': { x: 40, y: 340 },
  pharmacy: { x: 40, y: 440 },
  'ecw-amb': { x: 40, y: 540 },
  'rev-cycle': { x: 260, y: 100 },
  mpi: { x: 280, y: 250 },
  rhapsody: { x: 420, y: 300 },
  'edw-rwd': { x: 420, y: 480 },
  'rhapsody-edge': { x: 640, y: 300 },
  'hie-gw': { x: 640, y: 480 },
  'hmk-claims': { x: 860, y: 60 },
  'hmk-elig': { x: 860, y: 180 },
  'prior-auth': { x: 860, y: 320 },
  'care-mgmt': { x: 860, y: 460 },
  'payer-portal': { x: 1080, y: 120 },
};

const CANVAS_W = 1280;
const CANVAS_H = 660;

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
  // Cubic bezier with horizontal control handles for readable arcs
  return `M ${sx} ${sy} C ${sx + curve} ${sy}, ${tx - curve} ${ty}, ${tx} ${ty}`;
}

function edgeMidpoint(sourceId: string, targetId: string): { x: number; y: number } {
  const s = nodeCenter(sourceId);
  const t = nodeCenter(targetId);
  return { x: (s.x + t.x) / 2, y: (s.y + t.y) / 2 - 8 };
}

export function ResidencyMap() {
  const [dataClass, setDataClass] = useState<DataClass | 'all'>('all');
  const [entity, setEntity] = useState<LegalEntity | 'all'>('all');
  const [region, setRegion] = useState<Region | 'all'>('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);

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
    <div className="sk-map-layout">
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
          Legal entity
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
            <i className="dot payer" /> Payer
          </span>
          <span>
            <i className="dot provider" /> Provider
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
              </defs>
              {visibleEdges.map((e) => {
                const stroke = edgeStroke(e.status);
                const marker =
                  e.status === 'active'
                    ? 'url(#arrow-active)'
                    : e.status === 'degraded' || e.status === 'constrained'
                      ? 'url(#arrow-warn)'
                      : 'url(#arrow-bad)';
                const mid = edgeMidpoint(e.source, e.target);
                const opacity = e.status === 'missing' ? 0.45 : 0.9;
                return (
                  <g key={e.id} opacity={opacity}>
                    <path
                      d={edgePath(e.source, e.target)}
                      fill="none"
                      stroke={stroke}
                      strokeWidth={1.75}
                      markerEnd={marker}
                      strokeDasharray={
                        e.status === 'missing' || e.status === 'broken' ? '5 4' : undefined
                      }
                    />
                    <rect
                      x={mid.x - Math.min(54, e.protocol.length * 3.2)}
                      y={mid.y - 9}
                      width={Math.min(108, e.protocol.length * 6.4 + 10)}
                      height={16}
                      rx={3}
                      fill="#0f172a"
                      fillOpacity={0.88}
                    />
                    <text
                      x={mid.x}
                      y={mid.y + 3}
                      textAnchor="middle"
                      fill="#94a3b8"
                      fontSize={9}
                      fontFamily="system-ui, sans-serif"
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
              return (
                <button
                  key={s.id}
                  type="button"
                  className={`sk-flow-node entity-${s.legalEntity}${isSelected ? ' selected' : ''}`}
                  style={{
                    left: pos.x,
                    top: pos.y,
                    width: NODE_W,
                    borderColor: ENTITY_COLOR[s.legalEntity],
                  }}
                  onClick={() => setSelectedId(s.id)}
                  aria-pressed={isSelected}
                  title={s.label}
                >
                  <div className="sk-flow-node-accent" style={{ background: ENTITY_COLOR[s.legalEntity] }} />
                  <div className="sk-flow-node-title">{s.shortName}</div>
                  <div className="sk-flow-node-meta">
                    {s.legalEntity} · {s.region}
                  </div>
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
