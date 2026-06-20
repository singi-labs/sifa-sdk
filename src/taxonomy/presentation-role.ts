/**
 * Presentation-role taxonomy. Mirrors `id.sifa.defs#presentationRole.knownValues`
 * from sifa-lexicons. The role describes how the person took part in a single
 * delivery (it can differ between deliveries of the same presentation).
 */

export interface PresentationRoleOption {
  value: string;
  label: string;
}

export const PRESENTATION_ROLE_OPTIONS: PresentationRoleOption[] = [
  { value: 'id.sifa.defs#presenter', label: 'Presenter' },
  { value: 'id.sifa.defs#panelist', label: 'Panelist' },
  { value: 'id.sifa.defs#keynote', label: 'Keynote' },
  { value: 'id.sifa.defs#workshop', label: 'Workshop' },
  { value: 'id.sifa.defs#host', label: 'Host' },
];

export const PRESENTATION_ROLE_LABELS: Record<string, string> = Object.fromEntries(
  PRESENTATION_ROLE_OPTIONS.map((o) => [o.value, o.label]),
);

/** Resolve a label for a presentation-role token. Falls back to the raw value. */
export function getPresentationRoleLabel(value: string | undefined | null): string | undefined {
  if (!value) return undefined;
  return PRESENTATION_ROLE_LABELS[value] ?? value;
}
