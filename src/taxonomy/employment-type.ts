/**
 * Employment-type taxonomy. Mirrors `id.sifa.defs#employmentType.knownValues`
 * from sifa-lexicons. Surfaces both a flat NSID→label map (for read-only
 * display) and a grouped structure (for editor dropdowns).
 */

export interface EmploymentTypeOption {
  value: string;
  label: string;
}

export interface EmploymentTypeGroup {
  label: string;
  items: EmploymentTypeOption[];
}

export const EMPLOYMENT_TYPE_GROUPS: EmploymentTypeGroup[] = [
  {
    label: 'Employee',
    items: [
      { value: 'id.sifa.defs#fullTime', label: 'Full-time' },
      { value: 'id.sifa.defs#partTime', label: 'Part-time' },
      { value: 'id.sifa.defs#temporary', label: 'Temporary' },
      { value: 'id.sifa.defs#seasonal', label: 'Seasonal' },
    ],
  },
  {
    label: 'Independent',
    items: [
      { value: 'id.sifa.defs#contract', label: 'Contract' },
      { value: 'id.sifa.defs#freelance', label: 'Freelance' },
      { value: 'id.sifa.defs#selfEmployed', label: 'Self-employed' },
      { value: 'id.sifa.defs#independentWork', label: 'Independent work' },
    ],
  },
  {
    label: 'Training & early-career',
    items: [
      { value: 'id.sifa.defs#internship', label: 'Internship' },
      { value: 'id.sifa.defs#apprenticeship', label: 'Apprenticeship' },
      { value: 'id.sifa.defs#fellowship', label: 'Fellowship' },
      { value: 'id.sifa.defs#trainee', label: 'Trainee' },
    ],
  },
];

export const EMPLOYMENT_TYPE_LABELS: Record<string, string> = {
  ...Object.fromEntries(
    EMPLOYMENT_TYPE_GROUPS.flatMap((g) => g.items).map((o) => [o.value, o.label]),
  ),
  // `volunteer` is retained for legacy records but no longer offered in the
  // editor dropdown. Volunteering is a distinct thing (no payroll, no formal
  // role, no obligation) rather than a kind of employment, so it lives in the
  // dedicated `id.sifa.profile.volunteering` section, not on the employment-type
  // axis. Kept here so old positions still render a human label, not the raw NSID.
  'id.sifa.defs#volunteer': 'Volunteer',
};

/** Resolve a label for an employment-type token. Falls back to the raw value. */
export function getEmploymentTypeLabel(value: string | undefined | null): string | undefined {
  if (!value) return undefined;
  return EMPLOYMENT_TYPE_LABELS[value] ?? value;
}

/**
 * Employment-type group whose members may omit a company name: independent
 * workers (contract, freelance, self-employed, independent work) often have no
 * separately named or registered entity. Derived from the group rather than a
 * hand-maintained list so it stays in sync if the group's membership changes.
 */
export const COMPANY_OPTIONAL_EMPLOYMENT_TYPES: ReadonlySet<string> = new Set(
  EMPLOYMENT_TYPE_GROUPS.find((g) => g.label === 'Independent')?.items.map((i) => i.value) ?? [],
);

/**
 * Whether a company name is required for a position with the given employment
 * type. Company is optional for the Independent group; required otherwise,
 * including when the employment type is unspecified (the conservative default,
 * since most positions are at a named organization).
 */
export function isCompanyRequired(employmentType: string | undefined | null): boolean {
  if (!employmentType) return true;
  return !COMPANY_OPTIONAL_EMPLOYMENT_TYPES.has(employmentType);
}
