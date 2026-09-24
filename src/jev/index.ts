/**
 * `@singi-labs/sifa-sdk/jev` -- TypeSafe System One (Jev) question builders,
 * taxonomies, result schemas, and threshold predicates for Sifa's organisation
 * intelligence.
 *
 * This subpath is pure: it defines the typed *questions* to ask Jev, validates
 * the *answers*, and holds the policy constants (thresholds, taxonomies) that
 * turn a raw judgment into a decision. It performs no network calls and needs
 * no API key, so it is safe to import anywhere. The actual `systemOne` call
 * lives server-side in sifa-api, which passes an API key that must never reach
 * the browser.
 *
 * Judgment shapes:
 * - Duplicate-org detection: a single Noul over a candidate pair.
 * - Firmographic classification: independent Choice questions (industry, type,
 *   size) asked together over one org's state.
 *
 * See docs.typesafe.ai for the wire contract. Typed output guarantees the
 * interface, not truth: validate thresholds on labelled Sifa data before
 * enabling any write.
 */

import { z } from 'zod';

// ---------------------------------------------------------------------------
// Wire question types
// ---------------------------------------------------------------------------

/** A yes/no judgment. `criteria` clarifies what true vs false means. */
export interface NoulQuestion {
  type: 'noul';
  instructions: string;
  criteria?: { true: string; false: string };
}

/** A single-selection judgment. `criteria` maps each option to its description. */
export interface ChoiceQuestion {
  type: 'choice';
  instructions: string;
  criteria: Record<string, string>;
}

// ---------------------------------------------------------------------------
// Answer schemas (validate Jev's response before code trusts it)
// ---------------------------------------------------------------------------

/** Jev's Noul answer: `noul` is the probability that the answer is yes (0..1). */
export const noulAnswerSchema = z.object({
  type: z.literal('noul'),
  noul: z.number().min(0).max(1),
});
export type NoulAnswer = z.infer<typeof noulAnswerSchema>;

/**
 * Jev's Choice answer: `choice` is the highest-probability option, `confidence`
 * summarises how concentrated the distribution is, `probabilities` sums to 1.
 */
export const choiceAnswerSchema = z.object({
  type: z.literal('choice'),
  choice: z.string(),
  confidence: z.number().min(0).max(1),
  probabilities: z.record(z.string(), z.number()),
});
export type ChoiceAnswer = z.infer<typeof choiceAnswerSchema>;

// ---------------------------------------------------------------------------
// Duplicate-org detection (Noul) -- ticket #560
// ---------------------------------------------------------------------------

/** Public, non-user fields we compare when judging whether two orgs are the same. */
export interface OrgRecordInput {
  name: string;
  domain?: string;
  location?: string;
  description?: string;
}

/** Build a plain object with only the defined keys (Jev sees no `undefined`). */
function compact<T extends object>(obj: T): Partial<T> {
  const out: Partial<T> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v !== undefined && v !== null && v !== '') out[k as keyof T] = v as T[keyof T];
  }
  return out;
}

/**
 * State for the org-pair judgment. Both records live under stable named fields
 * so the question can reference them unambiguously.
 */
export function buildOrgPairState(
  a: OrgRecordInput,
  b: OrgRecordInput,
): { orgA: Partial<OrgRecordInput>; orgB: Partial<OrgRecordInput> } {
  return { orgA: compact(a), orgB: compact(b) };
}

/** Static Noul question paired with {@link buildOrgPairState}. */
export const ORG_PAIR_NOUL_QUESTION: NoulQuestion = {
  type: 'noul',
  instructions:
    'The state holds two organisation records, orgA and orgB. Do they refer to the same real-world organisation?',
  criteria: {
    true: 'Same organisation, e.g. a legal-suffix or abbreviation variant of the same name, or the same primary domain.',
    false:
      'Distinct organisations, e.g. a shared word in the name but different domains, locations, or lines of business.',
  },
};

/**
 * Threshold favouring precision: a wrong merge is worse than a missed one.
 * Validate on labelled pairs (ticket #560) before enabling merges in prod.
 */
export const SAME_ORG_THRESHOLD = 0.85;

/** True when the Noul probability clears the merge threshold. */
export function isLikelySameOrg(noul: number, threshold: number = SAME_ORG_THRESHOLD): boolean {
  return noul >= threshold;
}

// ---------------------------------------------------------------------------
// Firmographic classification (Choice) -- ticket #561
// ---------------------------------------------------------------------------

/** Industry taxonomy. Single source of truth; `other` is the no-match option. */
export const INDUSTRY_TAXONOMY: Record<string, string> = {
  technology: 'Software, IT services, internet, hardware, telecoms',
  finance: 'Banking, insurance, investment, fintech, accounting',
  healthcare: 'Medical care, pharma, biotech, health services',
  education: 'Schools, universities, training, edtech',
  manufacturing: 'Industrial production, hardware, materials, automotive',
  retail: 'Retail, ecommerce, consumer goods, hospitality, food',
  media: 'Media, publishing, entertainment, marketing, advertising',
  energy: 'Energy, utilities, oil and gas, renewables',
  construction: 'Construction, real estate, architecture, engineering',
  transport: 'Transport, logistics, shipping, aviation',
  professional_services: 'Legal, consulting, HR, business services',
  public_sector: 'Government, defence, public administration',
  nonprofit: 'Charities, NGOs, foundations, associations',
  agriculture: 'Agriculture, farming, fishing, forestry',
  other: 'None of the above, or not enough information to decide',
};

/**
 * Organisation type (the org's FORM, not its sector -- a hospital's type is
 * healthcare_provider while its industry is healthcare). `other` is the no-match
 * option. Prefer the registry `legalForm` where it already encodes the form.
 */
export const ORG_TYPE_TAXONOMY: Record<string, string> = {
  company: 'For-profit company or corporation',
  cooperative: 'Member-owned co-operative (e.g. eG, SCOP, mutual, credit union)',
  nonprofit: 'Nonprofit, charity, or NGO',
  foundation: 'Grant-making or endowed foundation (e.g. Stiftung, fonds)',
  government: 'Government body, agency, or public-sector authority',
  educational: 'School, college, or university',
  research_institute: 'Independent research institute or laboratory',
  healthcare_provider: 'Hospital, clinic, or healthcare provider',
  professional_association: 'Professional association, trade body, or trade union',
  religious: 'Religious organisation',
  political: 'Political party or organisation',
  self_employed: 'Sole proprietor, freelancer, or self-employed individual',
  other: 'None of the above, or not enough information to decide',
};

/** Ordered employee-size bands; `unknown` is the no-match option. */
export const SIZE_BAND_TAXONOMY: Record<string, string> = {
  solo: '1 person',
  small: '2 to 10 people',
  medium: '11 to 50 people',
  large: '51 to 250 people',
  enterprise: 'More than 250 people',
  unknown: 'Not enough information to decide',
};

function choiceQuestion(instructions: string, criteria: Record<string, string>): ChoiceQuestion {
  return { type: 'choice', instructions, criteria };
}

export const INDUSTRY_CHOICE_QUESTION = choiceQuestion(
  'Based on the org state, which single industry best describes this organisation?',
  INDUSTRY_TAXONOMY,
);

export const ORG_TYPE_CHOICE_QUESTION = choiceQuestion(
  'Based on the org state, which single organisation type (its form, not its industry sector) best describes this organisation?',
  ORG_TYPE_TAXONOMY,
);

export const SIZE_BAND_CHOICE_QUESTION = choiceQuestion(
  'Based on the org state, which employee-size band best fits this organisation?',
  SIZE_BAND_TAXONOMY,
);

/** Input for firmographic classification. Enrichment text is the primary evidence. */
export interface FirmographicInput {
  name: string;
  domain?: string;
  enrichmentText: string;
}

/** State for the firmographic questions. */
export function buildFirmographicState(org: FirmographicInput): Partial<FirmographicInput> {
  return compact(org);
}

/**
 * Below this confidence a firmographic field is left unset rather than guessed.
 * Validate per field on labelled orgs (ticket #561).
 */
export const FIRMOGRAPHIC_CONFIDENCE_FLOOR = 0.6;

/**
 * Select the classified option, or `null` to leave the field unset. Returns
 * null when confidence is below the floor, or when the selected option is the
 * taxonomy's no-match option.
 */
export function pickChoiceAboveFloor(
  answer: ChoiceAnswer,
  opts: { floor?: number; noMatch?: string } = {},
): string | null {
  const floor = opts.floor ?? FIRMOGRAPHIC_CONFIDENCE_FLOOR;
  if (answer.confidence < floor) return null;
  if (opts.noMatch !== undefined && answer.choice === opts.noMatch) return null;
  return answer.choice;
}
