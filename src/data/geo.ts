/**
 * Scout marker schema for Geo residency map (SIM).
 * Coords are approximate demo positions — not survey-grade / not eligibility truth.
 */

export type GeoLayer = 'ahn-hospitals' | 'neighborhood' | 'highmark-hq' | 'external';

export type GeoEntityColor = 'family' | 'external' | 'payer';

export interface GeoMarker {
  /** Scout marker id */
  id: string;
  lat: number;
  lng: number;
  /** Display label (SIM) */
  label: string;
  layer: GeoLayer;
  /** Color family for pin */
  color: GeoEntityColor;
  /**
   * SiteKick SystemNode id for the detail drawer.
   * Neighborhood / extra AHN campuses map to ahn-hub when no dedicated node exists.
   * Highmark HQ maps to a payer node (hmk-claims).
   */
  systemId: string;
}

/** Default Pittsburgh-metro camera (Scout) */
export const PA_MAP_CENTER: [number, number] = [-79.95, 40.45];
export const PA_MAP_ZOOM = 9;
/** Wider camera when statewide externals (Hershey / York / Reading) are visible */
export const PA_STATEWIDE_ZOOM = 7;

/**
 * Primary basemap: Carto Dark Matter GL (MapLibre style JSON, no API key).
 * Paints roads/labels reliably in demo rooms.
 */
export const OSM_STYLE_URL =
  'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json';

/** Compact attribution for UI chrome (tiles carry full OSM/CARTO credit). */
export const GEO_BASEMAP_ATTRIBUTION = 'Carto Dark Matter · © OSM · © CARTO';

/**
 * Inline raster fallback when the vector style URL fails to load.
 * Uses Carto dark raster tiles so the map never stays blank.
 */
export const RASTER_OSM_FALLBACK_STYLE = {
  version: 8 as const,
  sources: {
    'carto-dark-raster': {
      type: 'raster' as const,
      tiles: [
        'https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
        'https://b.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
        'https://c.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
      ],
      tileSize: 256,
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      maxzoom: 19,
    },
  },
  layers: [
    {
      id: 'carto-dark-raster-layer',
      type: 'raster' as const,
      source: 'carto-dark-raster',
      minzoom: 0,
      maxzoom: 19,
    },
  ],
};

export const GEO_LAYER_OPTIONS: { id: GeoLayer; label: string }[] = [
  { id: 'ahn-hospitals', label: 'AHN hospitals' },
  { id: 'neighborhood', label: 'Neighborhood' },
  { id: 'highmark-hq', label: 'Highmark HQ' },
  { id: 'external', label: 'External' },
];

export const DEFAULT_GEO_LAYERS: Record<GeoLayer, boolean> = {
  'ahn-hospitals': true,
  neighborhood: true,
  'highmark-hq': true,
  external: true,
};

/** Scout markers — exact schema (SIM-labeled) */
export const GEO_MARKERS: GeoMarker[] = [
  // Highmark HQ → payer drawer target
  {
    id: 'highmark-hq',
    lat: 40.4419,
    lng: -80.0034,
    label: 'Highmark HQ (Fifth Ave Place) (SIM)',
    layer: 'highmark-hq',
    color: 'payer',
    systemId: 'hmk-claims',
  },

  // AHN hospitals (flagships + regional)
  {
    id: 'ahn-allegheny-general',
    lat: 40.457,
    lng: -80.0033,
    label: 'AHN Allegheny General (SIM)',
    layer: 'ahn-hospitals',
    color: 'family',
    systemId: 'ahn-agh',
  },
  {
    id: 'ahn-west-penn',
    lat: 40.461,
    lng: -79.9461,
    label: 'AHN West Penn (SIM)',
    layer: 'ahn-hospitals',
    color: 'family',
    systemId: 'ahn-westpenn',
  },
  {
    id: 'ahn-jefferson',
    lat: 40.3185,
    lng: -79.9334,
    label: 'AHN Jefferson (SIM)',
    layer: 'ahn-hospitals',
    color: 'family',
    systemId: 'ahn-jefferson',
  },
  {
    id: 'ahn-forbes',
    lat: 40.4289,
    lng: -79.7482,
    label: 'AHN Forbes (SIM)',
    layer: 'ahn-hospitals',
    color: 'family',
    systemId: 'ahn-forbes',
  },
  {
    id: 'ahn-allegheny-valley',
    lat: 40.6186,
    lng: -79.7367,
    label: 'AHN Allegheny Valley (SIM)',
    layer: 'ahn-hospitals',
    color: 'family',
    systemId: 'ahn-hub',
  },
  {
    id: 'ahn-canonsburg',
    lat: 40.2462,
    lng: -80.1907,
    label: 'AHN Canonsburg (SIM)',
    layer: 'ahn-hospitals',
    color: 'family',
    systemId: 'ahn-hub',
  },
  {
    id: 'ahn-wexford',
    lat: 40.6359,
    lng: -80.0627,
    label: 'AHN Wexford (SIM)',
    layer: 'ahn-hospitals',
    color: 'family',
    systemId: 'ahn-wexford',
  },
  {
    id: 'ahn-grove-city',
    lat: 41.1709,
    lng: -80.0851,
    label: 'AHN Grove City (SIM)',
    layer: 'ahn-hospitals',
    color: 'family',
    systemId: 'ahn-hub',
  },
  {
    id: 'ahn-saint-vincent',
    lat: 42.1114,
    lng: -80.0799,
    label: 'AHN Saint Vincent Erie (SIM)',
    layer: 'ahn-hospitals',
    color: 'family',
    systemId: 'ahn-stvincent',
  },
  {
    id: 'ahn-beaver-heritage',
    lat: 40.712,
    lng: -80.3216,
    label: 'AHN Beaver – Heritage Valley (SIM)',
    layer: 'ahn-hospitals',
    color: 'family',
    systemId: 'ahn-beaver',
  },
  {
    id: 'ahn-sewickley-heritage',
    lat: 40.5425,
    lng: -80.1781,
    label: 'AHN Sewickley – Heritage Valley (SIM)',
    layer: 'ahn-hospitals',
    color: 'family',
    systemId: 'ahn-sewickley',
  },
  {
    id: 'ahn-westfield',
    lat: 42.329,
    lng: -79.5702,
    label: 'AHN Westfield Memorial (SIM)',
    layer: 'ahn-hospitals',
    color: 'family',
    systemId: 'ahn-hub',
  },

  // Neighborhood hospitals
  {
    id: 'ahn-brentwood',
    lat: 40.3761,
    lng: -79.9849,
    label: 'AHN Brentwood (neighborhood) (SIM)',
    layer: 'neighborhood',
    color: 'family',
    systemId: 'ahn-hub',
  },
  {
    id: 'ahn-hempfield',
    lat: 40.3109,
    lng: -79.6002,
    label: 'AHN Hempfield (neighborhood) (SIM)',
    layer: 'neighborhood',
    color: 'family',
    systemId: 'ahn-hub',
  },
  {
    id: 'ahn-mccandless',
    lat: 40.568,
    lng: -80.0254,
    label: 'AHN McCandless (neighborhood) (SIM)',
    layer: 'neighborhood',
    color: 'family',
    systemId: 'ahn-hub',
  },
  {
    id: 'ahn-harmar',
    lat: 40.4872,
    lng: -79.8853,
    label: 'AHN Harmar (neighborhood) (SIM)',
    layer: 'neighborhood',
    color: 'family',
    systemId: 'ahn-hub',
  },

  // External hubs
  {
    id: 'ext-upmc-presbyterian',
    lat: 40.4427,
    lng: -79.9603,
    label: 'UPMC Presbyterian (SIM)',
    layer: 'external',
    color: 'external',
    systemId: 'upmc',
  },
  {
    id: 'ext-upmc-shadyside',
    lat: 40.4553,
    lng: -79.9398,
    label: 'UPMC Shadyside (SIM)',
    layer: 'external',
    color: 'external',
    systemId: 'upmc',
  },
  {
    id: 'ext-independence-butler',
    lat: 40.8666,
    lng: -79.881,
    label: 'Independence HS Butler (SIM)',
    layer: 'external',
    color: 'external',
    systemId: 'independence-hs',
  },
  {
    id: 'ext-penn-state-hershey',
    lat: 40.2637,
    lng: -76.6748,
    label: 'Penn State Health Hershey (SIM)',
    layer: 'external',
    color: 'external',
    systemId: 'penn-state',
  },
  {
    id: 'ext-wellspan-york',
    lat: 39.9467,
    lng: -76.7184,
    label: 'WellSpan York (SIM)',
    layer: 'external',
    color: 'external',
    systemId: 'wellspan',
  },
  {
    id: 'ext-tower-reading',
    lat: 40.3306,
    lng: -75.9502,
    label: 'Tower Health Reading (SIM)',
    layer: 'external',
    color: 'external',
    systemId: 'tower-health',
  },
];

/** Statewide external marker ids — widen camera when any of these are visible */
export const STATEWIDE_EXTERNAL_IDS = new Set([
  'ext-penn-state-hershey',
  'ext-wellspan-york',
  'ext-tower-reading',
  'ahn-saint-vincent',
  'ahn-westfield',
  'ahn-grove-city',
]);
