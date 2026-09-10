import type { PathNarrative } from './types';

/**
 * Curated click-path stories for Gap → Residency Map demos.
 * All paths reference existing SIM graph nodes/edges.
 * Every edge endpoint must appear in the same path's nodeIds.
 */
export const PATH_NARRATIVES: PathNarrative[] = [
  {
    id: 'n-upmc-mpi',
    gapId: 'g3',
    title: 'External UPMC ADT → AHN MPI mismatch',
    problem:
      'UPMC ADT events arrive only via selective Edge/HIE; enterprise MPI never fully enrolls UPMC MRNs against AHN/Highmark member IDs.',
    systemsTouched: ['UPMC', 'Rhap Edge', 'HIE GW', 'Rhapsody', 'MPI', 'AHN Hub'],
    residencyConstraint:
      'External residency + competitive sharing limits; no deep MPI enroll for UPMC MRNs.',
    dollarLever:
      'Duplicate testing, claim rejects, and out-of-network continuity risk ~$1.9M/yr (hyp.).',
    nodeIds: ['upmc', 'rhapsody-edge', 'hie-gw', 'rhapsody', 'mpi', 'ahn-hub'],
    edgeIds: ['e-upmc-edge', 'e-upmc-hie', 'e-edge-hie', 'e-rhap-mpi', 'e-ahn-hub-mpi'],
  },
  {
    id: 'n-ind-claims',
    gapId: 'g8',
    title: 'Independence HS → Edge → eligibility / claims',
    problem:
      'Independence HS encounters reach Highmark only via constrained HIE→Edge; eligibility at registration misses product tier rules and claim attachment lags.',
    systemsTouched: ['Independence HS', 'HIE GW', 'Rhap Edge', 'Rhapsody', 'HM Elig', 'HM Claims'],
    residencyConstraint:
      'External residency; narrow-network product tiering at registration via Edge-mediated eligibility.',
    dollarLever:
      'Bad debt / leakage from missed tier rules and delayed claim attachment ~$480K/yr (hyp.).',
    nodeIds: [
      'independence-hs',
      'hie-gw',
      'rhapsody-edge',
      'rhapsody',
      'hmk-elig',
      'hmk-claims',
    ],
    edgeIds: ['e-ind-hie', 'e-edge-hie', 'e-rhap-edge', 'e-elig-edge', 'e-claims-edge'],
  },
  {
    id: 'n-hie-edw',
    gapId: 'g4',
    title: 'HIE clinical → EDW / care management',
    problem:
      'HIE clinical reaches the shared spine only via constrained Edge; purpose-of-use and consent block payer use into EDW/RWD for care-mgmt analytics.',
    systemsTouched: ['HIE GW', 'Rhap Edge', 'Rhapsody', 'EDW/RWD'],
    residencyConstraint:
      'Shared analytics residency; consent / purpose-of-use blocks payer use of HIE clinical.',
    dollarLever:
      'Care-mgmt RWD opportunity and delayed intervention ~$1.5M/yr (hyp.).',
    nodeIds: ['hie-gw', 'rhapsody-edge', 'rhapsody', 'edw-rwd'],
    edgeIds: ['e-edge-hie', 'e-rhap-edge', 'e-rhap-edw'],
  },
  {
    id: 'n-prior-auth-ehr',
    gapId: 'g1',
    title: 'Prior auth vs EHR (AHN CRD not prod)',
    problem:
      'AHN family Epic path to Prior Auth is CRD-pilot only; OR & specialty still fax/portal with 3–5 day TAT.',
    systemsTouched: ['AHN Hub', 'Prior Auth', 'HM Claims'],
    residencyConstraint:
      'Family EHR residency is deep, but payer Prior Auth SaaS path is broken for automated CRD/DTR.',
    dollarLever:
      'OR throughput & specialty leakage from auth TAT ~$4.2M/yr (hyp.).',
    nodeIds: ['ahn-hub', 'prior-auth', 'hmk-claims'],
    edgeIds: ['e-ahn-pa', 'e-pa-claims'],
  },
  {
    id: 'n-ext-pa',
    gapId: 'g2',
    title: 'External network → Prior Auth path missing',
    problem:
      'External orgs have no automated CRD; staff portals and product-network variance abandon referrals.',
    systemsTouched: ['External Hub', 'Prior Auth', 'Rhap Edge'],
    residencyConstraint:
      'External residency; missing automated path and narrow-network exceptions.',
    dollarLever:
      'Auth denials & abandoned referrals ~$2.8M/yr (hyp.).',
    nodeIds: ['ext-hub', 'prior-auth', 'rhapsody-edge'],
    edgeIds: ['e-ext-pa', 'e-ext-hub-edge'],
  },
];

export function getNarrativeById(id: string): PathNarrative | undefined {
  return PATH_NARRATIVES.find((n) => n.id === id);
}

export function getNarrativeForGap(gapId: string): PathNarrative | undefined {
  return PATH_NARRATIVES.find((n) => n.gapId === gapId);
}
