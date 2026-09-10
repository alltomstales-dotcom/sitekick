import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  Controls,
  MiniMap,
  Handle,
  Position,
  useReactFlow,
  type Node,
  type Edge,
  type NodeProps,
  MarkerType,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import {
  SYSTEMS,
  EDGES,
  DATA_CLASS_OPTIONS,
  ENTITY_OPTIONS,
  REGION_OPTIONS,
} from '../data/systems';
import type { DataClass, LegalEntity, Region, SystemNode } from '../data/types';
import { NodeDetailDrawer } from './NodeDetailDrawer';

const ENTITY_COLOR: Record<LegalEntity, string> = {
  payer: '#3b82f6',
  provider: '#10b981',
  shared: '#a78bfa',
};

function SystemNodeView({ data }: NodeProps) {
  const n = data as unknown as SystemNode & { selected?: boolean };
  return (
    <div
      className={`sk-flow-node entity-${n.legalEntity} ${n.selected ? 'selected' : ''}`}
      style={{ borderColor: ENTITY_COLOR[n.legalEntity] }}
    >
      <Handle type="target" position={Position.Left} className="sk-handle" />
      <div className="sk-flow-node-title">{n.shortName}</div>
      <div className="sk-flow-node-meta">
        {n.legalEntity} · {n.region}
      </div>
      <Handle type="source" position={Position.Right} className="sk-handle" />
    </div>
  );
}

const nodeTypes = { system: SystemNodeView };

const LAYOUT: Record<string, { x: number; y: number }> = {
  'epic-ehr': { x: 40, y: 40 },
  scheduling: { x: 40, y: 160 },
  'lab-core': { x: 40, y: 280 },
  'pacs-dicom': { x: 40, y: 400 },
  pharmacy: { x: 40, y: 520 },
  'ecw-amb': { x: 40, y: 640 },
  'rev-cycle': { x: 260, y: 100 },
  rhapsody: { x: 400, y: 300 },
  mpi: { x: 400, y: 140 },
  'rhapsody-edge': { x: 600, y: 300 },
  'edw-rwd': { x: 400, y: 480 },
  'hie-gw': { x: 600, y: 480 },
  'hmk-claims': { x: 800, y: 60 },
  'hmk-elig': { x: 800, y: 180 },
  'prior-auth': { x: 800, y: 320 },
  'payer-portal': { x: 1000, y: 120 },
  'care-mgmt': { x: 800, y: 460 },
};

function MapCanvas({
  nodes,
  edges,
  onNodeClick,
}: {
  nodes: Node[];
  edges: Edge[];
  onNodeClick: (event: React.MouseEvent, node: Node) => void;
}) {
  const { fitView } = useReactFlow();

  useEffect(() => {
    const t = window.setTimeout(() => {
      fitView({ padding: 0.2, duration: 200 });
    }, 50);
    return () => window.clearTimeout(t);
  }, [nodes, edges, fitView]);

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      nodeTypes={nodeTypes}
      onNodeClick={onNodeClick}
      fitView
      minZoom={0.25}
      maxZoom={1.75}
      proOptions={{ hideAttribution: true }}
      nodesDraggable={false}
      nodesConnectable={false}
      elementsSelectable
      style={{ width: '100%', height: '100%' }}
    >
      <Background color="#1e293b" gap={20} />
      <Controls showInteractive={false} />
      <MiniMap
        nodeColor={(n) =>
          ENTITY_COLOR[(n.data as unknown as SystemNode).legalEntity] ?? '#64748b'
        }
        maskColor="rgba(2,6,23,0.7)"
      />
    </ReactFlow>
  );
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

  const nodes: Node[] = useMemo(
    () =>
      filteredSystems.map((s) => ({
        id: s.id,
        type: 'system',
        position: LAYOUT[s.id] ?? { x: 100, y: 100 },
        data: { ...s, selected: selectedId === s.id },
      })),
    [filteredSystems, selectedId],
  );

  const edges: Edge[] = useMemo(() => {
    return EDGES.filter((e) => filteredIds.has(e.source) && filteredIds.has(e.target))
      .filter((e) => dataClass === 'all' || e.dataClasses.includes(dataClass))
      .map((e) => {
        const stroke =
          e.status === 'active'
            ? '#34d399'
            : e.status === 'degraded' || e.status === 'constrained'
              ? '#fbbf24'
              : '#f87171';
        return {
          id: e.id,
          source: e.source,
          target: e.target,
          label: e.protocol,
          animated: e.status === 'active',
          style: { stroke, strokeWidth: 1.5, opacity: e.status === 'missing' ? 0.4 : 0.85 },
          labelStyle: { fill: '#94a3b8', fontSize: 9 },
          labelBgStyle: { fill: '#0f172a', fillOpacity: 0.85 },
          markerEnd: { type: MarkerType.ArrowClosed, color: stroke, width: 16, height: 16 },
        };
      });
  }, [filteredIds, dataClass]);

  const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    setSelectedId(node.id);
  }, []);

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
        </div>
      </div>

      <div className="sk-map-stage">
        <ReactFlowProvider>
          <MapCanvas nodes={nodes} edges={edges} onNodeClick={onNodeClick} />
        </ReactFlowProvider>
        <NodeDetailDrawer node={selected} edges={EDGES} onClose={() => setSelectedId(null)} />
      </div>
    </div>
  );
}
