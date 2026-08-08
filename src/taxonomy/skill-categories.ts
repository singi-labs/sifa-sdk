export const SKILL_CATEGORIES = [
  { value: 'technical', label: 'Technical' },
  { value: 'business', label: 'Business' },
  { value: 'creative', label: 'Creative' },
  { value: 'interpersonal', label: 'Interpersonal' },
  { value: 'industry', label: 'Industry' },
  { value: 'community', label: 'Community' },
  { value: 'security', label: 'Security' },
] as const;

export type SkillCategory = (typeof SKILL_CATEGORIES)[number]['value'];

export const CATEGORY_ORDER: ReadonlyArray<SkillCategory> = SKILL_CATEGORIES.map((c) => c.value);

export const CATEGORY_LABELS: Record<SkillCategory | 'other', string> = {
  ...(Object.fromEntries(SKILL_CATEGORIES.map((c) => [c.value, c.label])) as Record<
    SkillCategory,
    string
  >),
  other: 'Other',
};

/**
 * Reduces a `category` value from a skill record to a bare token.
 *
 * `id.sifa.profile.skill` publishes its `knownValues` in lexicon-ref form
 * (`id.sifa.defs#technical`), so a client writing that is following the
 * lexicon. Sifa's own surfaces store and compare bare tokens (`technical`), and
 * without this the ref form falls through to the "other" bucket. Both forms are
 * legal: `knownValues` is advisory in AT Protocol, not a closed enum.
 *
 * Normalising is not validating. An unrecognised value is returned as-is, in
 * lowercase, and callers decide what to do with it (`groupSkillsByCategory`
 * buckets it as "other").
 */
export function normalizeSkillCategory(value: string | undefined | null): string | undefined {
  if (typeof value !== 'string') return undefined;
  const afterRef = value.includes('#') ? value.slice(value.lastIndexOf('#') + 1) : value;
  const token = afterRef.trim().toLowerCase();
  return token === '' ? undefined : token;
}
