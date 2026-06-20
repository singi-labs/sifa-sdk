/**
 * Presentation link-type taxonomy. Mirrors
 * `id.sifa.defs#presentationLinkType.knownValues` from sifa-lexicons. Used to
 * pick an icon and a default label for a presentation or delivery link.
 */

export interface PresentationLinkTypeOption {
  value: string;
  label: string;
}

export const PRESENTATION_LINK_TYPE_OPTIONS: PresentationLinkTypeOption[] = [
  { value: 'id.sifa.defs#linkSlides', label: 'Slides' },
  { value: 'id.sifa.defs#linkRecording', label: 'Recording' },
  { value: 'id.sifa.defs#linkEvent', label: 'Event page' },
  { value: 'id.sifa.defs#linkRegistration', label: 'Registration' },
  { value: 'id.sifa.defs#linkWriteup', label: 'Write-up' },
  { value: 'id.sifa.defs#linkOther', label: 'Link' },
];

export const PRESENTATION_LINK_TYPE_LABELS: Record<string, string> = Object.fromEntries(
  PRESENTATION_LINK_TYPE_OPTIONS.map((o) => [o.value, o.label]),
);

/** Resolve a label for a presentation link-type token. Falls back to the raw value. */
export function getPresentationLinkTypeLabel(value: string | undefined | null): string | undefined {
  if (!value) return undefined;
  return PRESENTATION_LINK_TYPE_LABELS[value] ?? value;
}
