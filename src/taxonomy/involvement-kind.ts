/**
 * Involvement-kind taxonomy. Mirrors `id.sifa.defs#involvementKind.knownValues`
 * from sifa-lexicons. `label` is the picker/select label; `heading` is the
 * profile section heading a record of this kind renders under (charity records,
 * including mapped legacy `volunteering`, render under "Volunteering").
 */

export interface InvolvementKindOption {
  value: string;
  label: string;
  heading: string;
}

export const INVOLVEMENT_KIND_OPTIONS: InvolvementKindOption[] = [
  { value: 'id.sifa.defs#involvementOpenSource', label: 'Open source', heading: 'Open Source' },
  { value: 'id.sifa.defs#involvementCommunity', label: 'Community', heading: 'Community' },
  { value: 'id.sifa.defs#involvementCharity', label: 'Volunteering', heading: 'Volunteering' },
  { value: 'id.sifa.defs#involvementCivic', label: 'Civic', heading: 'Civic' },
  { value: 'id.sifa.defs#involvementOther', label: 'Other', heading: 'Other' },
];

export const INVOLVEMENT_KIND_LABELS: Record<string, string> = Object.fromEntries(
  INVOLVEMENT_KIND_OPTIONS.map((o) => [o.value, o.label]),
);

export const INVOLVEMENT_KIND_HEADINGS: Record<string, string> = Object.fromEntries(
  INVOLVEMENT_KIND_OPTIONS.map((o) => [o.value, o.heading]),
);

/** Resolve the select label for an involvement-kind token. Falls back to the raw value. */
export function getInvolvementKindLabel(value: string | undefined | null): string | undefined {
  if (!value) return undefined;
  return INVOLVEMENT_KIND_LABELS[value] ?? value;
}

/**
 * Resolve the display-section heading for an involvement-kind token. Unknown
 * kinds (including a future token an older client hasn't learned) fall under
 * "Other" so a record is never dropped from the profile.
 */
export function getInvolvementKindHeading(value: string | undefined | null): string {
  if (!value) return 'Other';
  return INVOLVEMENT_KIND_HEADINGS[value] ?? 'Other';
}
