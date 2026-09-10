import type { InterviewAnswer, InterviewQuestion, InterviewSectionId } from './types';

export const INTERVIEW_SECTIONS: {
  id: InterviewSectionId;
  label: string;
  blurb: string;
}[] = [
  {
    id: 'systems',
    label: 'Systems & ownership',
    blurb: 'Who owns what in the Highmark Hybrid world space (SIM).',
  },
  {
    id: 'residency',
    label: 'Residency & access',
    blurb: 'Where data lives, which product rules apply, and who can actually log in.',
  },
  {
    id: 'cross-silo',
    label: 'Cross-silo truth',
    blurb: 'Identity, API families, Rhapsody pattern, and Axon vs Axon Connect.',
  },
  {
    id: 'engagement',
    label: 'Engagement framing',
    blurb: 'One priority path for week one — not a novel of backlog.',
  },
];

/**
 * Day-1 Interview bank (14). Scout-sharpened Highmark↔AHN prompts + Rhapsody Axon / Axon Connect.
 * Must-haves: MPI member↔patient, g10/USCDI vs Patient Access/CARIN/PDex vs Da Vinci,
 * AHN HL7 v2 MLLP vs FHIR facade, Rhapsody dual-write vs query facade vs event bridge,
 * freeze plan product vs Together Blue/narrow-network, Axon Day-1 vs Axon Connect external.
 */
export const INTERVIEW_QUESTIONS: InterviewQuestion[] = [
  // ── Systems & ownership ─────────────────────────────────────────────
  {
    id: 'q-ownership-lanes',
    section: 'systems',
    text: 'Confirm the three ownership lanes: AHN / Highmark family (owned), external network providers (serve members, not owned), and payer systems (claims / elig / prior auth). Any system mis-bucketed today?',
    why: 'Wrong lane → wrong residency and access assumptions on the map.',
    nodeIds: ['ahn-hub', 'ext-hub', 'hmk-claims', 'hmk-elig', 'prior-auth'],
  },
  {
    id: 'q-axon-day1',
    section: 'systems',
    text: 'For the Day-1 spike inside Rhapsody/Corepoint: when do we use Rhapsody Axon (embedded agent — chat.axon.rhapsody.health) to interpret specs, propose mappings/transforms, and troubleshoot — vs waiting on tribal interface knowledge?',
    why: 'Axon accelerates mapping inside the engine; it is not a standalone tool.',
    nodeIds: ['rhapsody-axon', 'rhapsody', 'ahn-hub'],
    edgeIds: ['e-rhap-axon', 'e-axon-ahn-map'],
  },

  // ── Residency & access ──────────────────────────────────────────────
  {
    id: 'q-ahn-hl7-vs-fhir',
    section: 'residency',
    text: 'For AHN clinical egress into the hybrid spine: is the live path HL7 v2 over MLLP into Rhapsody, a FHIR facade over Epic, or both with a documented primary?',
    why: 'Do not assume FHIR if MLLP ADT/ORM/ORU is still the production truth.',
    nodeIds: ['ahn-hub', 'rhapsody', 'ahn-agh'],
    edgeIds: ['e-ahn-hub-rhap', 'e-agh-rhap'],
  },
  {
    id: 'q-freeze-product',
    section: 'residency',
    text: 'Freeze a single Highmark plan product for week-one discovery: broad commercial PPO vs Together Blue / other narrow-network. Which product’s network rules are in force for external sites (UPMC, Independence, etc.)?',
    why: 'Product variance changes which external edges are constrained vs missing.',
    nodeIds: ['hmk-elig', 'ext-hub', 'upmc', 'independence-hs'],
    edgeIds: ['e-upmc-hie', 'e-ind-hie'],
  },
  {
    id: 'q-day1-access',
    section: 'residency',
    text: 'On day 1, who can actually open AHN Hyperspace, the payer provider portal, prior-auth tooling, and Axon chat — and under which NPI / org credentials?',
    why: 'Access is residency’s twin; no login → no survey.',
    nodeIds: ['ahn-hub', 'payer-portal', 'prior-auth', 'rhapsody-axon'],
  },
  {
    id: 'q-external-edge',
    section: 'residency',
    text: 'For external network clinical (Independence, Tower, WellSpan, Penn State): is the path HIE CCD / Carequality only, or is there any live Edge HL7 / FHIR for the frozen product?',
    why: 'Separates assumed HIE from actual Edge routes.',
    nodeIds: ['ext-hub', 'hie-gw', 'rhapsody-edge', 'tower-health', 'wellspan'],
    edgeIds: ['e-ext-hub-hie', 'e-ext-hub-edge', 'e-tower-edge'],
  },

  // ── Cross-silo truth ────────────────────────────────────────────────
  {
    id: 'q-mpi-member-patient',
    section: 'cross-silo',
    text: 'Member vs patient identity: how does enterprise MPI match Highmark member IDs to AHN MRNs today (deterministic key, probabilistic, both)? What is the false-positive / no-match rate on the AHN family footprint?',
    why: 'Cross-silo truth starts at identity — claims and clinical diverge without it.',
    nodeIds: ['mpi', 'ahn-hub', 'hmk-elig'],
    edgeIds: ['e-ahn-hub-mpi', 'e-rhap-mpi'],
  },
  {
    id: 'q-api-families',
    section: 'cross-silo',
    text: 'Do not conflate API families: which are in scope this engagement — (a) USCDI / §170.315(g)(10) EHR export from AHN, (b) Patient Access / CARIN / PDex payer APIs, (c) Da Vinci CRD / DTR / PAS for prior auth? Pick primary; note others as out of scope.',
    why: 'g10 ≠ Patient Access ≠ Da Vinci. Mixing them burns the week.',
    nodeIds: ['ahn-hub', 'payer-portal', 'prior-auth', 'hmk-claims'],
    edgeIds: ['e-ahn-pa'],
  },
  {
    id: 'q-rhapsody-pattern',
    section: 'cross-silo',
    text: 'Rhapsody pattern for Highmark ↔ AHN: is the production truth dual-write (claims + clinical into a shared store), a query facade (on-demand pull), or an event bridge (ADT/claim events only)? Name the pattern that is actually live — Axon can accelerate whichever is true, not invent a fourth.',
    why: 'Architecture assumption drives every spike estimate.',
    nodeIds: ['rhapsody', 'rhapsody-axon', 'ahn-hub', 'hmk-claims', 'edw-rwd'],
    edgeIds: ['e-ahn-hub-rhap', 'e-claims-edge', 'e-rhap-edw', 'e-rhap-axon'],
  },
  {
    id: 'q-axon-connect',
    section: 'cross-silo',
    text: 'For external (UPMC / Independence / vendor) onboarding: when do we use Axon Connect playbooks (upload specs/business/security requirements → AI-ready playbook) vs one-off Edge ACL tickets?',
    why: 'Axon Connect cuts clarification cycles on partner go-live; Axon alone is for inside-engine work.',
    nodeIds: ['axon-connect', 'rhapsody-axon', 'rhapsody-edge', 'upmc', 'independence-hs'],
    edgeIds: ['e-axon-connect', 'e-connect-edge', 'e-connect-upmc', 'e-connect-ind'],
  },
  {
    id: 'q-hie-edw-consent',
    section: 'cross-silo',
    text: 'Is HIE clinical → EDW / RWD allowed for payer care-management use under current consent and purpose-of-use, or blocked pending policy / tokenization?',
    why: 'Dollar lever on avoidable readmissions and RWD contracts.',
    nodeIds: ['hie-gw', 'edw-rwd', 'rhapsody-edge'],
    edgeIds: ['e-edge-hie', 'e-rhap-edw'],
  },

  // ── Engagement framing ──────────────────────────────────────────────
  {
    id: 'q-money-path',
    section: 'engagement',
    text: 'If we only fix one path this week, which one — and why that dollar lever over the others?',
    why: 'The money question. Forces a single priority narrative.',
    nodeIds: ['ahn-hub', 'prior-auth', 'rhapsody-axon', 'axon-connect', 'ext-hub'],
    edgeIds: ['e-ahn-pa', 'e-axon-ahn-map', 'e-connect-upmc'],
  },
  {
    id: 'q-crd-status',
    section: 'engagement',
    text: 'AHN family → Prior Auth: is Da Vinci CRD/DTR in production, pilot-only, or still fax/portal fallback across campuses? Can Axon accelerate the mapping/transform spike either way?',
    why: 'Top $$ gap on the board; confirm before promising PAS.',
    nodeIds: ['ahn-hub', 'prior-auth', 'rhapsody-axon'],
    edgeIds: ['e-ahn-pa', 'e-axon-ahn-map'],
  },
  {
    id: 'q-external-mpi',
    section: 'engagement',
    text: 'Do external MRNs (UPMC, Independence, etc.) enroll in enterprise MPI at all for the frozen product, or is family-only matching the honest state — and is an Axon Connect playbook the right vehicle to close that?',
    why: 'Explains duplicate testing / claim rejects; ties identity to partner onboarding.',
    nodeIds: ['ext-hub', 'mpi', 'upmc', 'axon-connect'],
    edgeIds: ['e-upmc-edge', 'e-connect-upmc'],
  },
];

export function emptyInterviewAnswers(): Record<string, InterviewAnswer> {
  const out: Record<string, InterviewAnswer> = {};
  for (const q of INTERVIEW_QUESTIONS) {
    out[q.id] = { status: 'unanswered', notes: '' };
  }
  return out;
}

export function interviewedNodeIds(
  answers: Record<string, InterviewAnswer>,
): Set<string> {
  const nodes = new Set<string>();
  for (const q of INTERVIEW_QUESTIONS) {
    if (answers[q.id]?.status === 'answered') {
      for (const id of q.nodeIds) nodes.add(id);
    }
  }
  return nodes;
}

export function interviewedEdgeIds(
  answers: Record<string, InterviewAnswer>,
): Set<string> {
  const edges = new Set<string>();
  for (const q of INTERVIEW_QUESTIONS) {
    if (answers[q.id]?.status === 'answered' && q.edgeIds) {
      for (const id of q.edgeIds) edges.add(id);
    }
  }
  return edges;
}

export function interviewProgress(
  answers: Record<string, InterviewAnswer>,
): { answered: number; total: number; systemsConfirmed: number } {
  const total = INTERVIEW_QUESTIONS.length;
  let answered = 0;
  for (const q of INTERVIEW_QUESTIONS) {
    if (answers[q.id]?.status === 'answered') answered += 1;
  }
  return {
    answered,
    total,
    systemsConfirmed: interviewedNodeIds(answers).size,
  };
}
