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
