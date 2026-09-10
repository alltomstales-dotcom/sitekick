import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Map as MapLibreMap,
  Marker,
  NavigationControl,
  Popup,
  LngLatBounds,
  type ExpressionSpecification,
  type GeoJSONSource,
  type MapLayerMouseEvent,
  type StyleSpecification,
} from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import type { PathNarrative, SystemEdge, SystemNode } from '../data/types';
import {
  DEFAULT_GEO_LAYERS,
  GEO_BASEMAP_ATTRIBUTION,
  GEO_LAYER_OPTIONS,
  GEO_MARKERS,
  GEO_SDOH_ATTRIBUTION,
  OSM_STYLE_URL,
  PA_MAP_CENTER,
  PA_MAP_ZOOM,
  PA_STATEWIDE_ZOOM,
  PA_SVI_GEOJSON_URL,
  RASTER_OSM_FALLBACK_STYLE,
  SDOH_DISCLAIMER,
  STATEWIDE_EXTERNAL_IDS,
  type GeoEntityColor,
  type GeoLayer,
  type GeoMarker,
  type SdohOverlay,
} from '../data/geo';

const ENTITY_COLOR: Record<GeoEntityColor, string> = {
  family: '#10b981',
  external: '#f59e0b',
  payer: '#3b82f6',
  shared: '#a78bfa',
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
    .replace('Westfield Memorial', 'Westfield')
    .replace('Rhapsody core', 'Rhapsody')
    .replace('Rhapsody Edge', 'Rhap Edge')
    .replace('Rhapsody Axon', 'Rhap Axon')
    .replace('Axon Connect', 'Axon Conn')
    .replace('HIE gateway', 'HIE GW')
    .replace('External network hub', 'Ext hub')
    .replace('Highmark Eligibility', 'HM Elig')
    .replace('Prior Auth Platform', 'Prior Auth')
    .replace('Payer Provider Portal', 'Payer Portal')
    .replace('EDW / Real-World Data', 'EDW/RWD');
}

function ensurePathLayers(map: MapLibreMap) {
  if (map.getSource('sk-path-edges')) return;
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
}

const SDOH_SOURCE = 'sk-sdoh-svi';
const SDOH_FILL = 'sk-sdoh-svi-fill';
const SDOH_OUTLINE = 'sk-sdoh-svi-outline';
const OVERLAY_LAYER_IDS = new Set([
  'sk-path-edges-glow',
  'sk-path-edges-line',
  SDOH_FILL,
  SDOH_OUTLINE,
]);

/** Statewide PA camera when SVI choropleth is enabled (once per toggle-on). */
const PA_SVI_BOUNDS: [[number, number], [number, number]] = [
  [-80.6, 39.65],
  [-74.65, 42.3],
];

const SVI_FILL_COLOR: ExpressionSpecification = [
  'interpolate',
  ['linear'],
  ['to-number', ['coalesce', ['get', 'rpl_themes'], 0]],
  0,
  '#14b8a6',
  0.35,
  '#38bdf8',
  0.65,
  '#a855f7',
  1,
  '#f43f5e',
];

function ensureSdohLayers(map: MapLibreMap, data: Parameters<GeoJSONSource['setData']>[0] | null) {
  if (!data) return;

  if (!map.getSource(SDOH_SOURCE)) {
    map.addSource(SDOH_SOURCE, { type: 'geojson', data });
  } else {
    (map.getSource(SDOH_SOURCE) as GeoJSONSource).setData(data);
  }

  if (!map.getLayer(SDOH_FILL)) {
    map.addLayer({
      id: SDOH_FILL,
      type: 'fill',
      source: SDOH_SOURCE,
      layout: { visibility: 'none' },
      paint: {
        'fill-color': SVI_FILL_COLOR,
        'fill-opacity': 0.72,
        'fill-antialias': true,
      },
    });
  } else {
    map.setPaintProperty(SDOH_FILL, 'fill-color', SVI_FILL_COLOR);
    map.setPaintProperty(SDOH_FILL, 'fill-opacity', 0.72);
  }

  if (!map.getLayer(SDOH_OUTLINE)) {
    map.addLayer({
      id: SDOH_OUTLINE,
      type: 'line',
      source: SDOH_SOURCE,
      layout: { visibility: 'none' },
      paint: {
        'line-color': '#e2e8f0',
        'line-width': 1.35,
        'line-opacity': 0.9,
      },
    });
  } else {
    map.setPaintProperty(SDOH_OUTLINE, 'line-color', '#e2e8f0');
    map.setPaintProperty(SDOH_OUTLINE, 'line-width', 1.35);
    map.setPaintProperty(SDOH_OUTLINE, 'line-opacity', 0.9);
  }

  // Keep choropleth above Carto Dark Matter fills/labels; path edges above fills.
  try {
    map.moveLayer(SDOH_FILL);
    map.moveLayer(SDOH_OUTLINE);
    if (map.getLayer('sk-path-edges-glow')) map.moveLayer('sk-path-edges-glow');
    if (map.getLayer('sk-path-edges-line')) map.moveLayer('sk-path-edges-line');
  } catch {
    /* style mid-swap */
  }
}

function setSdohVisibility(map: MapLibreMap, on: boolean) {
  const vis = on ? 'visible' : 'none';
  if (map.getLayer(SDOH_FILL)) map.setLayoutProperty(SDOH_FILL, 'visibility', vis);
  if (map.getLayer(SDOH_OUTLINE)) map.setLayoutProperty(SDOH_OUTLINE, 'visibility', vis);
}

function syncMarkerDom(
  el: HTMLElement,
  m: GeoMarker,
  opts: {
    color: string;
    isSelected: boolean;
    onPath: boolean;
    onQuery: boolean;
    dimmed: boolean;
  },
) {
  const { color, isSelected, onPath, onQuery, dimmed } = opts;
  const nextClass = `sk-geo-marker entity-${m.color}${isSelected ? ' selected' : ''}${onPath || onQuery ? ' on-path' : ''}${dimmed ? ' dimmed' : ''}`;
  if (el.className !== nextClass) el.className = nextClass;
  el.style.setProperty('--marker-color', color);
  el.title = m.label;
  el.setAttribute('aria-label', m.label);

  let pin = el.querySelector('.sk-geo-marker-pin') as HTMLElement | null;
  let labelEl = el.querySelector('.sk-geo-marker-label') as HTMLElement | null;
  if (!pin || !labelEl) {
    el.replaceChildren();
    pin = document.createElement('span');
    pin.className = 'sk-geo-marker-pin';
    labelEl = document.createElement('span');
    labelEl.className = 'sk-geo-marker-label';
    el.append(pin, labelEl);
  }
  const text = shortLabel(m.label);
  if (labelEl.textContent !== text) labelEl.textContent = text;
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
  /** Controlled SDOH choropleth (Map Query / Voice) */
  sdohOverlay?: SdohOverlay;
  onSdohOverlayChange?: (overlay: SdohOverlay) => void;
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
  sdohOverlay: sdohProp,
  onSdohOverlayChange,
}: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const markersRef = useRef<Map<string, Marker>>(new Map());
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;
  const lineFeaturesRef = useRef<{
    type: 'FeatureCollection';
    features: unknown[];
  }>({ type: 'FeatureCollection', features: [] });
  const usedStyleFallbackRef = useRef(false);

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

  const [sdohInternal, setSdohInternal] = useState<SdohOverlay>('off');
  const sdoh = sdohProp ?? sdohInternal;
  const setSdoh = (next: SdohOverlay) => {
    if (onSdohOverlayChange) onSdohOverlayChange(next);
    else setSdohInternal(next);
  };

  const sviDataRef = useRef<Parameters<GeoJSONSource['setData']>[0] | null>(null);
  const sviFitDoneRef = useRef(false);
  const [sviReady, setSviReady] = useState(false);
  const [sviError, setSviError] = useState<string | null>(null);
  const popupRef = useRef<Popup | null>(null);
  const sdohRef = useRef(sdoh);
  const sviReadyRef = useRef(sviReady);
  sdohRef.current = sdoh;
  sviReadyRef.current = sviReady;

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
          width: onPath ? 4 : 2.5,
          // Always-on links when no path; dim non-path when a path is active
          opacity: dimmed
            ? 0.12
            : onPath
              ? 1
              : e.status === 'missing'
                ? 0.45
                : 0.7,
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

  lineFeaturesRef.current = lineFeatures;

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

    const applyLineData = () => {
      const src = map.getSource('sk-path-edges') as GeoJSONSource | undefined;
      if (src) {
        src.setData(lineFeaturesRef.current as Parameters<GeoJSONSource['setData']>[0]);
      }
    };

    const onStyleReady = () => {
      ensurePathLayers(map);
      ensureSdohLayers(map, sviDataRef.current);
      setSdohVisibility(map, sdohRef.current === 'svi' && sviReadyRef.current);
      applyLineData();
      map.resize();
    };

    map.on('load', onStyleReady);
    // setStyle() fires styledata / load again after fallback
    map.on('style.load', onStyleReady);

    const onMapError = (e: { error?: Error | { message?: string }; status?: number }) => {
      if (usedStyleFallbackRef.current) return;
      const msg = (e.error && 'message' in e.error ? e.error.message : '') || '';
      const status = e.status ?? 0;
      const looksLikeStyleFailure =
        status >= 400 ||
        /style|fetch|network|Failed to fetch|AJAXError|load/i.test(msg) ||
        !map.isStyleLoaded();
      if (!looksLikeStyleFailure && map.isStyleLoaded()) return;
      usedStyleFallbackRef.current = true;
      map.setStyle(RASTER_OSM_FALLBACK_STYLE as StyleSpecification);
    };
    map.on('error', onMapError);

    // If vector style never paints, fall back after a short grace period
    const fallbackTimer = window.setTimeout(() => {
      if (usedStyleFallbackRef.current) return;
      // No basemap layers beyond our path overlays ⇒ style likely blank
      const layers = map.getStyle()?.layers ?? [];
      const hasBasemap = layers.some((l) => !OVERLAY_LAYER_IDS.has(l.id));
      if (!hasBasemap || !map.isStyleLoaded()) {
        usedStyleFallbackRef.current = true;
        map.setStyle(RASTER_OSM_FALLBACK_STYLE as StyleSpecification);
      }
    }, 4000);

    const ro = new ResizeObserver(() => {
      map.resize();
    });
    ro.observe(containerRef.current);
    // Tab / layout may assign size after mount
    requestAnimationFrame(() => map.resize());

    return () => {
      window.clearTimeout(fallbackTimer);
      ro.disconnect();
      map.off('error', onMapError);
      map.off('load', onStyleReady);
      map.off('style.load', onStyleReady);
      for (const m of markersRef.current.values()) m.remove();
      markersRef.current.clear();
      popupRef.current?.remove();
      popupRef.current = null;
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Prefetch PA county SVI GeoJSON (cached under public/geo)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(PA_SVI_GEOJSON_URL);
        if (!res.ok) throw new Error(`SVI fetch ${res.status}`);
        const json = (await res.json()) as Parameters<GeoJSONSource['setData']>[0];
        if (cancelled) return;
        sviDataRef.current = json;
        setSviReady(true);
        setSviError(null);
        const map = mapRef.current;
        if (map?.isStyleLoaded()) {
          ensureSdohLayers(map, json);
          if (sdohRef.current === 'svi') setSdohVisibility(map, true);
        }
      } catch (err) {
        if (cancelled) return;
        setSviError(err instanceof Error ? err.message : 'SVI load failed');
        setSviReady(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Sync SDOH visibility + click popup
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const apply = () => {
      ensurePathLayers(map);
      ensureSdohLayers(map, sviDataRef.current);
      const show = sdoh === 'svi' && sviReady;
      // Force visible whenever overlay is SVI and data is ready (post-ensure / style.load).
      setSdohVisibility(map, show);
      if (show && !sviFitDoneRef.current) {
        sviFitDoneRef.current = true;
        map.fitBounds(PA_SVI_BOUNDS, { padding: 48, duration: 650, maxZoom: 8.5 });
      }
      if (!show) {
        // Allow another statewide fit next time user turns SVI on.
        sviFitDoneRef.current = false;
      }
    };
    if (map.isStyleLoaded()) apply();
    else map.once('load', apply);

    const onEnter = () => {
      map.getCanvas().style.cursor = sdoh === 'svi' ? 'pointer' : '';
    };
    const onLeave = () => {
      map.getCanvas().style.cursor = '';
    };
    const onClick = (e: MapLayerMouseEvent) => {
      if (sdoh !== 'svi') return;
      const f = e.features?.[0];
      if (!f) return;
      const name = String(f.properties?.name ?? 'County');
      const rpl = Number(f.properties?.rpl_themes);
      const rplTxt = Number.isFinite(rpl) ? rpl.toFixed(3) : 'n/a';
      if (!popupRef.current) {
        popupRef.current = new Popup({
          closeButton: true,
          closeOnClick: true,
          maxWidth: '240px',
          className: 'sk-geo-sdoh-popup',
        });
      }
      popupRef.current
        .setLngLat(e.lngLat)
        .setHTML(
          `<div class="sk-geo-sdoh-tip"><strong>${name} County</strong><div>SVI overall (RPL_THEMES): <b>${rplTxt}</b></div><div class="sk-geo-sdoh-tip-note">CDC/ATSDR 2022 · aggregate · not PHI</div></div>`,
        )
        .addTo(map);
    };

    if (sdoh === 'svi' && map.getLayer(SDOH_FILL)) {
      map.on('mouseenter', SDOH_FILL, onEnter);
      map.on('mouseleave', SDOH_FILL, onLeave);
      map.on('click', SDOH_FILL, onClick);
    }

    return () => {
      map.off('mouseenter', SDOH_FILL, onEnter);
      map.off('mouseleave', SDOH_FILL, onLeave);
      map.off('click', SDOH_FILL, onClick);
      map.getCanvas().style.cursor = '';
    };
  }, [sdoh, sviReady]);

  // Sync edge lines
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const apply = () => {
      ensurePathLayers(map);
      const src = map.getSource('sk-path-edges') as GeoJSONSource | undefined;
      if (src) src.setData(lineFeatures as Parameters<GeoJSONSource['setData']>[0]);
    };
    if (map.isStyleLoaded()) apply();
    else map.once('load', apply);
  }, [lineFeatures]);

  // Sync markers — update classes/text; do not rewrite innerHTML every pass
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
        syncMarkerDom(el, m, { color, isSelected, onPath, onQuery, dimmed });
        marker = new Marker({ element: el, anchor: 'bottom' })
          .setLngLat([m.lng, m.lat])
          .addTo(map);
        markersRef.current.set(m.id, marker);
      } else {
        syncMarkerDom(marker.getElement(), m, { color, isSelected, onPath, onQuery, dimmed });
        marker.setLngLat([m.lng, m.lat]);
      }
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
      <div className="sk-geo-sdoh" role="group" aria-label="SDOH overlays">
        <button
          type="button"
          className={`sk-geo-layer-btn sk-geo-sdoh-btn${sdoh === 'svi' ? ' active' : ''}`}
          aria-pressed={sdoh === 'svi'}
          disabled={!sviReady}
          title={
            sviError
              ? `SVI unavailable: ${sviError}`
              : sviReady
                ? 'CDC/ATSDR SVI 2022 overall county ranking'
                : 'Loading PA county SVI…'
          }
          onClick={() => setSdoh(sdoh === 'svi' ? 'off' : 'svi')}
        >
          SDOH: SVI
        </button>
        <button
          type="button"
          className="sk-geo-layer-btn sk-geo-sdoh-btn"
          disabled
          title="CDC PLACES county measures deferred for V0 — stub only"
          aria-disabled="true"
        >
          SDOH: PLACES (soon)
        </button>
        {sviError && (
          <div className="sk-geo-sdoh-error" role="alert">
            SVI load failed: {sviError}
          </div>
        )}
        {sdoh === 'svi' && sviReady && (
          <div className="sk-geo-sdoh-legend" aria-hidden>
            <span className="sk-geo-sdoh-legend-label">SVI low</span>
            <span className="sk-geo-sdoh-ramp" />
            <span className="sk-geo-sdoh-legend-label">high</span>
          </div>
        )}
      </div>
      {sdoh === 'svi' && sviReady && (
        <div className="sk-geo-sdoh-disclaimer" role="note">
          {SDOH_DISCLAIMER}
        </div>
      )}
      <div className="sk-geo-caveat" role="note">
        Map ≠ eligibility / product-specific network (SIM)
      </div>
      <div className="sk-geo-sim-note" aria-hidden>
        Scout coords · SIM · {GEO_BASEMAP_ATTRIBUTION}
        {sdoh === 'svi' ? ` · ${GEO_SDOH_ATTRIBUTION}` : ''} · no API key
      </div>
    </div>
  );
}
