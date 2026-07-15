const PROFICIENCY_RANK: Record<string, number> = {
  native: 5,
  full_professional: 4,
  professional_working: 3,
  limited_working: 2,
  elementary: 1,
};

function rank(proficiency: string | undefined): number {
  if (!proficiency) return 0;
  return PROFICIENCY_RANK[proficiency] ?? 0;
}

/** Sort languages by proficiency (native first), then alphabetically within a rank. */
export function sortLanguagesByProficiency<T extends { language?: string; proficiency?: string }>(
  items: T[],
): T[] {
  return [...items].sort((a, b) => {
    const diff = rank(b.proficiency) - rank(a.proficiency);
    if (diff !== 0) return diff;
    return (a.language ?? '').localeCompare(b.language ?? '');
  });
}
