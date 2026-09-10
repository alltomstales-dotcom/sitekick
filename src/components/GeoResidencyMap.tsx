import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Map as MapLibreMap,
  Marker,
  NavigationControl,
  LngLatBounds,
  type GeoJSONSource,
} from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import type { PathNarrative, SystemEdge, SystemNode } from '../data/types';
import {
  DEFAULT_GEO_LAYERS,
  GEO_LAYER_OPTIONS,
  GEO_MARKERS,
  OSM_STYLE_URL,
  PA_MAP_CENTER,
  PA_MAP_ZOOM,
  PA_STATEWIDE_ZOOM,
  STATEWIDE_EXTERNAL_IDS,
  type GeoEntityColor,
  type GeoLayer,
  type GeoMarker,
} from '../data/geo';

const ENTITY_COLOR: Record<GeoEntityColor, string> = {
  family: '#10b981',
  external: '#f59e0b',
  payer: '#3b82f6',
};

function edgeStroke(status: SystemEdge['status']): string {
  if (status === 'active') return '#34d399';
  if (status === 'degraded' || status === 'constrained') return '#fbbf24';
  return '#f87171';
}

function shortLabel(label: string): string {
  return label
    .replace(/ \(SIM\)$/, '')
    .replace(/^AHN /, '')
    .replace(/^UPMC /, 'UPMC ')
    .replace(' – Heritage Valley', '')
    .replace(' (neighborhood)', ' nbd')
    .replace('Highmark HQ (Fifth Ave Place)', 'Highmark HQ')
    .replace('Independence HS Butler', 'Independence')
    .replace('Penn State Health Hershey', 'PSH Hershey')
    .replace('WellSpan York', 'WellSpan')
    .replace('Tower Health Reading', 'Tower')
    .replace('Allegheny General', 'AGH')
    .replace('Saint Vincent Erie', 'St Vincent')
    .replace('Westfield Memorial', 'Westfield');
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

interface Props {
  systems: SystemNode[];
  edges: SystemEdge[];
  selectedId: string | null;
  onSelect: (systemId: string) => void;
  activePath: PathNarrative | null;
  pathNodeSet: Set<string> | null;
  pathEdgeSet: Set<string> | null;
  /** Controlled Geo layer visibility (Map Query / Voice) */
  layers?: Record<GeoLayer, boolean>;
  onLayersChange?: (layers: Record<GeoLayer, boolean>) => void;
  /** Extra node ids to brighten (query highlight) */
  queryHighlightSet?: Set<string> | null;
}

export function GeoResidencyMap({
  systems,
  edges,
  selectedId,
  onSelect,
  activePath,
  pathNodeSet,
  pathEdgeSet,
  layers: layersProp,
  onLayersChange,
  queryHighlightSet,
}: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const markersRef = useRef<Map<string, Marker>>(new Map());
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;

  const [layersInternal, setLayersInternal] = useState<Record<GeoLayer, boolean>>(() => ({
    ...DEFAULT_GEO_LAYERS,
  }));
  const layers = layersProp ?? layersInternal;
  const setLayers = (updater: (prev: Record<GeoLayer, boolean>) => Record<GeoLayer, boolean>) => {
    if (onLayersChange) {
      onLayersChange(updater(layers));
    } else {
      setLayersInternal(updater);
    }
  };

  const filteredSystemIds = useMemo(() => new Set(systems.map((s) => s.id)), [systems]);

  const visibleMarkers = useMemo(() => {
    return GEO_MARKERS.filter((m) => {
      if (!layers[m.layer]) return false;
      // Keep markers whose drawer target passes filters, OR roster-only AHN campuses (ahn-hub)
      if (!filteredSystemIds.has(m.systemId)) return false;
      return true;
    });
  }, [layers, filteredSystemIds]);

  const lineFeatures = useMemo(() => {
    const bySystem = new Map<string, GeoMarker[]>();
    for (const m of visibleMarkers) {
      const list = bySystem.get(m.systemId) ?? [];
      list.push(m);
      bySystem.set(m.systemId, list);
    }

    const feats: Array<{
      type: 'Feature';
      properties: {
        id: string;
        onPath: boolean;
        color: string;
        width: number;
        opacity: number;
      };
      geometry: { type: 'LineString'; coordinates: [number, number][] };
    }> = [];

    for (const e of edges) {
      const sources = bySystem.get(e.source);
      const targets = bySystem.get(e.target);
      if (!sources?.length || !targets?.length) continue;
      const onPath = pathEdgeSet?.has(e.id) ?? false;
      const dimmed = pathEdgeSet != null && !onPath;
      // Connect first marker of each endpoint (path highlight uses path edges)
      const a = sources[0];
      const b = targets[0];
      feats.push({
        type: 'Feature',
        properties: {
          id: e.id,
          onPath,
          color: onPath ? '#38bdf8' : edgeStroke(e.status),
          width: onPath ? 4 : 2,
          opacity: dimmed ? 0.1 : onPath ? 1 : pathEdgeSet ? 0.2 : e.status === 'missing' ? 0.35 : 0.55,
        },
        geometry: {
          type: 'LineString',
          coordinates: [
            [a.lng, a.lat],
            [b.lng, b.lat],
          ],
        },
      });
    }
    return { type: 'FeatureCollection' as const, features: feats };
  }, [visibleMarkers, edges, pathEdgeSet]);

  // Init map once
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new MapLibreMap({
      container: containerRef.current,
      style: OSM_STYLE_URL,
      center: PA_MAP_CENTER,
      zoom: PA_MAP_ZOOM,
      attributionControl: { compact: true },
    });
    map.addControl(new NavigationControl({ showCompass: false }), 'top-left');
    mapRef.current = map;

    map.on('load', () => {
      map.addSource('sk-path-edges', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
      });
      map.addLayer({
        id: 'sk-path-edges-glow',
        type: 'line',
        source: 'sk-path-edges',
        filter: ['==', ['get', 'onPath'], true],
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: {
          'line-color': '#38bdf8',
          'line-width': 8,
          'line-opacity': 0.35,
          'line-blur': 2,
        },
      });
      map.addLayer({
        id: 'sk-path-edges-line',
        type: 'line',
        source: 'sk-path-edges',
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: {
          'line-color': ['get', 'color'],
          'line-width': ['get', 'width'],
          'line-opacity': ['get', 'opacity'],
        },
      });
    });

    return () => {
      for (const m of markersRef.current.values()) m.remove();
      markersRef.current.clear();
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Sync edge lines
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const apply = () => {
      const src = map.getSource('sk-path-edges') as GeoJSONSource | undefined;
      if (src) src.setData(lineFeatures as Parameters<GeoJSONSource['setData']>[0]);
    };
    if (map.isStyleLoaded()) apply();
    else map.once('load', apply);
  }, [lineFeatures]);

  // Sync markers
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const keep = new Set(visibleMarkers.map((m) => m.id));
    for (const [id, marker] of markersRef.current) {
      if (!keep.has(id)) {
        marker.remove();
        markersRef.current.delete(id);
      }
    }

    for (const m of visibleMarkers) {
      const onPath = pathNodeSet?.has(m.systemId) ?? false;
      const onQuery = queryHighlightSet?.has(m.systemId) ?? false;
      const focusSet = pathNodeSet ?? queryHighlightSet ?? null;
      const dimmed = focusSet != null && !focusSet.has(m.systemId);
      const isSelected = selectedId === m.systemId;
      const color = onPath || onQuery ? '#38bdf8' : ENTITY_COLOR[m.color];

      let marker = markersRef.current.get(m.id);
      if (!marker) {
        const el = document.createElement('button');
        el.type = 'button';
        el.className = 'sk-geo-marker';
        el.addEventListener('click', (ev) => {
          ev.stopPropagation();
          onSelectRef.current(m.systemId);
        });
        marker = new Marker({ element: el, anchor: 'bottom' })
          .setLngLat([m.lng, m.lat])
          .addTo(map);
        markersRef.current.set(m.id, marker);
      }

      const el = marker.getElement();
      el.className = `sk-geo-marker entity-${m.color}${isSelected ? ' selected' : ''}${onPath || onQuery ? ' on-path' : ''}${dimmed ? ' dimmed' : ''}`;
      el.style.setProperty('--marker-color', color);
      el.title = m.label;
      el.setAttribute('aria-label', m.label);
      el.innerHTML = `<span class="sk-geo-marker-pin"></span><span class="sk-geo-marker-label">${escapeHtml(shortLabel(m.label))}</span>`;
      marker.setLngLat([m.lng, m.lat]);
    }
  }, [visibleMarkers, selectedId, pathNodeSet, queryHighlightSet]);

  // Camera: metro default; widen when statewide externals/Erie visible or path spans them
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const focusSet =
      pathNodeSet && pathNodeSet.size > 0
        ? pathNodeSet
        : queryHighlightSet && queryHighlightSet.size > 0
          ? queryHighlightSet
          : null;
    const focusMarkers = focusSet
      ? visibleMarkers.filter((m) => focusSet.has(m.systemId))
      : visibleMarkers;

    if (focusMarkers.length === 0) {
      map.easeTo({ center: PA_MAP_CENTER, zoom: PA_MAP_ZOOM, duration: 500 });
      return;
    }

    const needsStatewide = focusMarkers.some((m) => STATEWIDE_EXTERNAL_IDS.has(m.id));
    const bounds = new LngLatBounds();
    for (const m of focusMarkers) bounds.extend([m.lng, m.lat]);

    map.fitBounds(bounds, {
      padding: { top: 64, bottom: 72, left: 56, right: 72 },
      maxZoom: needsStatewide ? PA_STATEWIDE_ZOOM + 0.4 : activePath ? 10 : PA_MAP_ZOOM,
      duration: 650,
    });
  }, [visibleMarkers, pathNodeSet, queryHighlightSet, activePath, layers]);

  const toggleLayer = (id: GeoLayer) => {
    setLayers((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="sk-geo-wrap">
      <div
        ref={containerRef}
        className="sk-geo-map"
        role="application"
        aria-label="Geographic residency map"
      />
      <div className="sk-geo-layers" role="group" aria-label="Map layers">
        {GEO_LAYER_OPTIONS.map((opt) => (
          <button
            key={opt.id}
            type="button"
            className={`sk-geo-layer-btn${layers[opt.id] ? ' active' : ''}`}
            aria-pressed={layers[opt.id]}
            onClick={() => toggleLayer(opt.id)}
          >
            {opt.label}
          </button>
        ))}
      </div>
      <div className="sk-geo-caveat" role="note">
        Map ≠ eligibility / product-specific network (SIM)
      </div>
      <div className="sk-geo-sim-note" aria-hidden>
        Scout coords · SIM · OpenFreeMap OSM · no API key
      </div>
    </div>
  );
}
