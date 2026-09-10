export type LegalEntity = 'payer' | 'provider' | 'shared';
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
  legalEntity: LegalEntity;
  region: Region;
  dataClasses: DataClass[];
  auth: string;
  confidence: Confidence;
  description: string;
  accessPaths: string[];
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
