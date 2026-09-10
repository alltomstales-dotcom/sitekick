import type { PathNarrative } from './types';

/**
 * Curated click-path stories for Gap → Residency Map and Feed Health → Map demos.
 * All paths reference existing SIM graph nodes/edges.
 * Every edge endpoint must appear in the same path's nodeIds.
 */
export const PATH_NARRATIVES: PathNarrative[] = [
  {
    id: 'n-upmc-mpi',
    gapId: 'g3',
    feedId: 'upmc',
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
    feedId: 'hie-gw',
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
    feedId: 'prior-auth',
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
    feedId: 'ext-hub',
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

  // ── Feed Health → map paths (feeds without a gap narrative) ──────────
  {
    id: 'f-ahn-hub',
    feedId: 'ahn-hub',
    title: 'AHN Hub ADT / orders feed → spine',
    problem:
      'AHN Hub message rate drops or lag spikes; family ADT/ORM completeness into Rhapsody and MPI softens for downstream claims and care-mgmt.',
    systemsTouched: ['AHN Hub', 'Rhapsody', 'MPI', 'EDW/RWD'],
    residencyConstraint:
      'Family residency — deep on-prem AHN DCs; feed health is the canary for owned-network completeness.',
    dollarLever:
      'Missed ADT → delayed utilization mgmt and claim attachment ~$620K/yr (hyp.).',
    nodeIds: ['ahn-hub', 'rhapsody', 'mpi', 'edw-rwd'],
    edgeIds: ['e-ahn-hub-rhap', 'e-ahn-hub-mpi', 'e-rhap-mpi', 'e-rhap-edw'],
  },
  {
    id: 'f-ahn-agh',
    feedId: 'ahn-agh',
    title: 'AHN AGH flagship feed → Hub / MPI',
    problem:
      'Allegheny General ADT/ORU lag or errors; Level I trauma and transplant events late into enterprise MPI and hub.',
    systemsTouched: ['AHN AGH', 'AHN Hub', 'Rhapsody', 'MPI'],
    residencyConstraint:
      'Family Pittsburgh DC residency; hospital→hub bus is active but feed ticks reveal site-level backpressure.',
    dollarLever:
      'Trauma continuity + transplant claim rejects ~$410K/yr (hyp.).',
    nodeIds: ['ahn-agh', 'ahn-hub', 'rhapsody', 'mpi'],
    edgeIds: ['e-ahn-hub-agh', 'e-agh-rhap', 'e-agh-mpi', 'e-ahn-hub-mpi'],
  },
  {
    id: 'f-hmk-elig',
    feedId: 'hmk-elig',
    title: 'Claims eligibility lag → Edge / AHN registration',
    problem:
      'HM Eligibility 270/271 lag or error bursts; registration at AHN and Edge-mediated external sites miss product tier rules.',
    systemsTouched: ['HM Elig', 'Rhap Edge', 'Rhapsody', 'AHN Hub'],
    residencyConstraint:
      'Payer cloud residency; eligibility must cross Edge into family and external registration workflows.',
    dollarLever:
      'Point-of-service collections and bad debt from stale elig ~$890K/yr (hyp.).',
    nodeIds: ['hmk-elig', 'rhapsody-edge', 'rhapsody', 'ahn-hub'],
    edgeIds: ['e-elig-edge', 'e-rhap-edge', 'e-elig-ahn'],
  },
  {
    id: 'f-hmk-claims',
    feedId: 'hmk-claims',
    title: 'Claims ingest lag → Edge / Prior Auth',
    problem:
      'HM Claims X12/REST feed degraded; attachment and PA status sync lag, inflating reject queues.',
    systemsTouched: ['HM Claims', 'Rhap Edge', 'Prior Auth', 'Rhapsody'],
    residencyConstraint:
      'Payer claims residency; Edge is the choke point for provider-side attachment and PA linkage.',
    dollarLever:
      'Reject rework and delayed remittance ~$1.1M/yr (hyp.).',
    nodeIds: ['hmk-claims', 'rhapsody-edge', 'prior-auth', 'rhapsody'],
    edgeIds: ['e-claims-edge', 'e-pa-claims', 'e-rhap-edge'],
  },
  {
    id: 'f-rhapsody',
    feedId: 'rhapsody',
    title: 'Rhapsody spine bus pressure',
    problem:
      'Core Rhapsody route lag/errors; family ADT, MPI match, Edge egress, and EDW ETL all queue behind the shared bus.',
    systemsTouched: ['Rhapsody', 'MPI', 'Rhap Edge', 'EDW/RWD', 'AHN Hub'],
    residencyConstraint:
      'Shared integration residency — single spine for family depth and Edge-mediated external traffic.',
    dollarLever:
      'Cross-silo backlog compounding care-mgmt and claims latency ~$750K/yr (hyp.).',
    nodeIds: ['rhapsody', 'mpi', 'rhapsody-edge', 'edw-rwd', 'ahn-hub'],
    edgeIds: ['e-ahn-hub-rhap', 'e-rhap-mpi', 'e-rhap-edge', 'e-rhap-edw'],
  },
  {
    id: 'f-rhapsody-edge',
    feedId: 'rhapsody-edge',
    title: 'Rhapsody Edge gateway degradation',
    problem:
      'Edge ACL / allowlist pressure; external UPMC/HIE and payer elig/claims paths throttle while family spine stays healthy.',
    systemsTouched: ['Rhap Edge', 'HIE GW', 'HM Elig', 'HM Claims', 'Rhapsody'],
    residencyConstraint:
      'Edge DMZ residency — constrained path for external + payer traffic into the shared spine.',
    dollarLever:
      'External continuity + elig-at-reg failures ~$980K/yr (hyp.).',
    nodeIds: ['rhapsody-edge', 'hie-gw', 'hmk-elig', 'hmk-claims', 'rhapsody'],
    edgeIds: ['e-edge-hie', 'e-elig-edge', 'e-claims-edge', 'e-rhap-edge'],
  },
  {
    id: 'f-mpi',
    feedId: 'mpi',
    title: 'Enterprise MPI match lag',
    problem:
      'MPI match/errors spike; UPMC MRNs and AHN family IDs fail to golden-record, starving EDW and claims identity.',
    systemsTouched: ['MPI', 'AHN Hub', 'Rhapsody', 'EDW/RWD'],
    residencyConstraint:
      'Shared identity residency; external MRNs never fully enroll — family matches stay high-confidence.',
    dollarLever:
      'Duplicate testing and claim rejects from identity drift ~$1.3M/yr (hyp.).',
    nodeIds: ['mpi', 'ahn-hub', 'rhapsody', 'edw-rwd'],
    edgeIds: ['e-ahn-hub-mpi', 'e-rhap-mpi', 'e-mpi-edw'],
  },
  {
    id: 'f-edw-rwd',
    feedId: 'edw-rwd',
    title: 'EDW / RWD ingest delay',
    problem:
      'EDW/RWD batch ETL degraded (T+1+); care-mgmt analytics miss HIE clinical and family ADT that already cleared Rhapsody.',
    systemsTouched: ['EDW/RWD', 'Rhapsody', 'MPI', 'HIE GW'],
    residencyConstraint:
      'Shared analytics residency; consent/purpose-of-use already limit HIE clinical — feed lag compounds the gap.',
    dollarLever:
      'Delayed intervention and RWD contract velocity ~$1.5M/yr (hyp.).',
    nodeIds: ['edw-rwd', 'rhapsody', 'mpi', 'hie-gw', 'rhapsody-edge'],
    edgeIds: ['e-rhap-edw', 'e-mpi-edw', 'e-rhap-edge', 'e-edge-hie'],
  },
  {
    id: 'f-penn-state',
    feedId: 'penn-state',
    title: 'Penn State Health → HIE → Edge',
    problem:
      'PSH clinical feed lag via Carequality/HIE; academic referral continuity into Highmark products stalls at Edge.',
    systemsTouched: ['Penn State', 'HIE GW', 'Rhap Edge', 'Rhapsody'],
    residencyConstraint:
      'External academic residency; referral-only pathways on some products constrain depth.',
    dollarLever:
      'Academic referral leakage ~$340K/yr (hyp.).',
    nodeIds: ['penn-state', 'hie-gw', 'rhapsody-edge', 'rhapsody'],
    edgeIds: ['e-psh-hie', 'e-edge-hie', 'e-rhap-edge'],
  },
  {
    id: 'f-wellspan',
    feedId: 'wellspan',
    title: 'WellSpan → HIE clinical delay',
    problem:
      'WellSpan HIE CCD lag or errors; central-PA product participation variance leaves care gaps after discharge.',
    systemsTouched: ['WellSpan', 'HIE GW', 'Rhap Edge', 'Rhapsody'],
    residencyConstraint:
      'External residency; product participation variance on HIE pathways.',
    dollarLever:
      'Avoidable readmissions from missing DC summaries ~$290K/yr (hyp.).',
    nodeIds: ['wellspan', 'hie-gw', 'rhapsody-edge', 'rhapsody'],
    edgeIds: ['e-wellspan-hie', 'e-edge-hie', 'e-rhap-edge'],
  },
  {
    id: 'f-tower',
    feedId: 'tower-health',
    title: 'Tower Health → Edge / HIE constrained',
    problem:
      'Tower Health Edge portal + HIE CCD degraded; fax fallback common under Together Blue exceptions.',
    systemsTouched: ['Tower Health', 'Rhap Edge', 'HIE GW', 'Rhapsody'],
    residencyConstraint:
      'External residency; Edge allowlists + consent/purpose-of-use constrain both legs.',
    dollarLever:
      'Fax rework and continuity gaps ~$260K/yr (hyp.).',
    nodeIds: ['tower-health', 'rhapsody-edge', 'hie-gw', 'rhapsody'],
    edgeIds: ['e-tower-edge', 'e-tower-hie', 'e-edge-hie', 'e-rhap-edge'],
  },
];

export function getNarrativeById(id: string): PathNarrative | undefined {
  return PATH_NARRATIVES.find((n) => n.id === id);
}

export function getNarrativeForGap(gapId: string): PathNarrative | undefined {
  return PATH_NARRATIVES.find((n) => n.gapId === gapId);
}

export function getNarrativeForFeed(feedId: string): PathNarrative | undefined {
  return PATH_NARRATIVES.find((n) => n.feedId === feedId);
}
