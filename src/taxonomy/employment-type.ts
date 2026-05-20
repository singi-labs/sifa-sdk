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
  {
    label: 'Other',
    items: [{ value: 'id.sifa.defs#volunteer', label: 'Volunteer' }],
  },
];

export const EMPLOYMENT_TYPE_LABELS: Record<string, string> = Object.fromEntries(
  EMPLOYMENT_TYPE_GROUPS.flatMap((g) => g.items).map((o) => [o.value, o.label]),
);

/** Resolve a label for an employment-type token. Falls back to the raw value. */
export function getEmploymentTypeLabel(value: string | undefined | null): string | undefined {
  if (!value) return undefined;
  return EMPLOYMENT_TYPE_LABELS[value] ?? value;
}
