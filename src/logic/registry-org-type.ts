/**
 * Organisation type from public registries, as an org-type token (the same
 * tokens as the Jev `ORG_TYPE_TAXONOMY` and the owner `companyType`).
 *
 * A registry type is recorded data, so it outranks a Jev guess. ROR records an
 * explicit `types` list per organisation; Wikidata records what an item is an
 * instance of (P31), which sifa-api resolves against the classes below through
 * the subclass hierarchy (P279*).
 */

/**
 * ROR schema-v2 types, most specific first. `funder`, `archive` and `other`
 * say nothing about the organisation's form and are not mapped.
 */
const ROR_TYPE_PRIORITY: ReadonlyArray<readonly [rorType: string, orgType: string]> = [
  ['healthcare', 'healthcare_provider'],
  ['education', 'educational'],
  ['facility', 'research_institute'],
  ['government', 'government'],
  ['nonprofit', 'nonprofit'],
  ['company', 'company'],
];

/** The org type for an organisation's ROR `types`, or null when none is mapped. */
export function orgTypeFromRorTypes(types: readonly string[] | null | undefined): string | null {
  if (!types || types.length === 0) return null;
  const lower = new Set(types.map((t) => t.toLowerCase()));
  for (const [rorType, orgType] of ROR_TYPE_PRIORITY) {
    if (lower.has(rorType)) return orgType;
  }
  return null;
}

/**
 * Wikidata classes per org type, in priority order. Through P279* an item
 * matches many classes at once (MIT is a university, a nonprofit, a research
 * institute and a business), so the first matching entry wins. Classes are
 * deliberately narrow: a broad class such as "medical organization" would pull
 * pharmaceutical companies into `healthcare_provider`.
 */
export const WIKIDATA_ORG_TYPE_CLASSES: ReadonlyArray<{
  orgType: string;
  qids: readonly string[];
}> = [
  // hospital, clinic
  { orgType: 'healthcare_provider', qids: ['Q16917', 'Q1774898'] },
  // higher education institution, university, school
  { orgType: 'educational', qids: ['Q38723', 'Q3918', 'Q3914'] },
  // research institute
  { orgType: 'research_institute', qids: ['Q31855'] },
  // government agency, intergovernmental organization
  { orgType: 'government', qids: ['Q327333', 'Q245065'] },
  // political party
  { orgType: 'political', qids: ['Q7278'] },
  // religious organization
  { orgType: 'religious', qids: ['Q1530022'] },
  // cooperative
  { orgType: 'cooperative', qids: ['Q4539'] },
  // labor union, professional or trade association
  { orgType: 'professional_association', qids: ['Q178790', 'Q1391517'] },
  // foundation
  { orgType: 'foundation', qids: ['Q157031'] },
  // nonprofit organization
  { orgType: 'nonprofit', qids: ['Q163740'] },
  // business, company
  { orgType: 'company', qids: ['Q4830453', 'Q783794'] },
];

/** Every class QID above, for building the SPARQL `VALUES` list. */
export const WIKIDATA_ORG_TYPE_CLASS_QIDS: readonly string[] = WIKIDATA_ORG_TYPE_CLASSES.flatMap(
  (c) => c.qids,
);

/**
 * The org type for the set of classes a Wikidata item matched, or null when
 * none of them is mapped.
 */
export function orgTypeFromWikidataClasses(matchedQids: readonly string[]): string | null {
  const matched = new Set(matchedQids);
  for (const { orgType, qids } of WIKIDATA_ORG_TYPE_CLASSES) {
    if (qids.some((q) => matched.has(q))) return orgType;
  }
  return null;
}
