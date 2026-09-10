export type LegalEntity = 'family' | 'external' | 'payer' | 'shared';
export type Region = 'east' | 'west' | 'central' | 'cloud';
export type DataClass =
  | 'clinical'
  | 'claims'
  | 'eligibility'
  | 'imaging'
  | 'lab'
  | 'pharmacy'
  | 'identity'
  | 'admin'
  | 'financial';

export type Reachability = 'path' | 'constrained' | 'none' | 'unknown';
export type Confidence = 'high' | 'medium' | 'low';

export interface SystemNode {
  id: string;
  label: string;
  shortName: string;
  vendor: string;
  hosting: string;
  residency: string;
  /** Ownership / network role: Highmark family, external network, payer, or shared infra */
  legalEntity: LegalEntity;
  region: Region;
  dataClasses: DataClass[];
  auth: string;
  confidence: Confidence;
  description: string;
  accessPaths: string[];
  /** Optional full org/hospital roster shown in the detail drawer (hubs) */
  hospitalList?: string[];
}

export interface SystemEdge {
  id: string;
  source: string;
  target: string;
  protocol: string;
  blockers: string[];
  dollarLevers: string[];
  status: 'active' | 'degraded' | 'constrained' | 'broken' | 'missing';
  dataClasses: DataClass[];
}

export interface GapItem {
  id: string;
  rank: number;
  title: string;
  systems: [string, string];
  impactUsd: number;
  hypothesis: string;
  blockers: string[];
  severity: 'critical' | 'high' | 'medium' | 'low';
}

export interface FeedMetric {
  systemId: string;
  messageRate: number;
  lagMs: number;
  lastSeenSec: number;
  errors: number;
  status: 'healthy' | 'warning' | 'critical';
}

export type ViewId = 'map' | 'matrix' | 'feeds' | 'gaps';

export interface PathNarrative {
  id: string;
  /** Optional link to a Gap / $$ Board item */
  gapId?: string;
  title: string;
  /** Short problem statement */
  problem: string;
  /** Human labels for systems on the path */
  systemsTouched: string[];
  /** Residency / access constraint summary */
  residencyConstraint: string;
  /** Dollar lever summary */
  dollarLever: string;
  /** Node ids to brighten on the residency map */
  nodeIds: string[];
  /** Edge ids to brighten on the residency map */
  edgeIds: string[];
}
