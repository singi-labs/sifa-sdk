/**
 * Education level taxonomy. Mirrors `id.sifa.profile.education#eqfLevel` from
 * sifa-lexicons: an integer on the European Qualifications Framework, 1 to 8
 * (6 bachelor, 7 master, 8 doctoral). Labels are plain language; EQF numbers
 * are never shown to users.
 */

export type EqfLevel = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

export interface EqfLevelOption {
  value: EqfLevel;
  label: string;
}

export const EQF_LEVEL_OPTIONS: EqfLevelOption[] = [
  { value: 1, label: 'Primary education' },
  { value: 2, label: 'Lower secondary' },
  { value: 3, label: 'Vocational or partial upper secondary' },
  { value: 4, label: 'Upper secondary' },
  { value: 5, label: 'Associate or short-cycle degree' },
  { value: 6, label: 'Bachelor' },
  { value: 7, label: 'Master' },
  { value: 8, label: 'Doctorate' },
];

export const EQF_LEVEL_LABELS: Record<EqfLevel, string> = Object.fromEntries(
  EQF_LEVEL_OPTIONS.map((o) => [o.value, o.label]),
) as Record<EqfLevel, string>;

/** Narrow an untrusted value (e.g. from a PDS record) to a valid EQF level. */
export function readEqfLevel(value: unknown): EqfLevel | undefined {
  return Number.isInteger(value) && (value as number) >= 1 && (value as number) <= 8
    ? (value as EqfLevel)
    : undefined;
}

/** Plain-language label for an EQF level, or undefined when absent or invalid. */
export function getEqfLevelLabel(level: number | undefined | null): string | undefined {
  const valid = readEqfLevel(level);
  return valid === undefined ? undefined : EQF_LEVEL_LABELS[valid];
}

// First match wins. Order matters: the master-level "doctor" titles (Doctor of
// Medicine, Juris Doctor, Dutch doctoraal / drs.) must be checked before the
// generic doctorate rule, which would otherwise claim them.
const DEGREE_RULES: [EqfLevel, RegExp][] = [
  [
    7,
    /\b(doctor of (medicine|dental \w+|pharmacy|veterinary \w+)|juris doctor|doctoraal|drs|md|jd|dds|dmd|pharmd|dvm)\b/,
  ],
  [
    8,
    /\b(phd|dphil|doctorate|doctoral|doctoraat|doctor|dr|edd|dba|dsc|scd|habilitation|promotie)\b/,
  ],
  [7, /\b(masters?|msc|ma|ms|mba|mphil|meng|mres|mfa|mpa|mph|llm|ir|mr)\b/],
  [6, /\b(bachelors?|bsc|ba|bs|beng|bba|bfa|llb|undergraduate|hbo)\b/],
  [5, /\b(associates?|associate degree|hnd|hnc|foundation degree)\b/],
  [
    4,
    /\b(high school|secondary school|vwo|havo|abitur|a levels?|matura|international baccalaureate|ged)\b/,
  ],
];

/**
 * Suggest an EQF level from a free-text degree ("PhD", "Dr.", "doctoraat",
 * "MSc", "BSc", ...). Returns undefined when the text does not clearly name a
 * level. A suggestion only: callers must let the user confirm it before it is
 * written to their repo.
 */
export function suggestEqfLevelFromDegree(degree: string | undefined | null): EqfLevel | undefined {
  if (!degree) return undefined;
  const text = degree
    .toLowerCase()
    .replace(/['’.]/g, '')
    .replace(/[-_/()]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (!text) return undefined;
  return DEGREE_RULES.find(([, re]) => re.test(text))?.[0];
}
