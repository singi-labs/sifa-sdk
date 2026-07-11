/**
 * Artifact-link-kind taxonomy. Mirrors the bare-string `knownValues` of
 * `id.sifa.defs#artifactLink.kind` from sifa-lexicons. Open set: any string is
 * valid; these are the recognized kinds used to pick an icon and a default label.
 */

export interface ArtifactLinkKindOption {
  value: string;
  label: string;
}

export const ARTIFACT_LINK_KIND_OPTIONS: ArtifactLinkKindOption[] = [
  { value: 'pull-request', label: 'Pull request' },
  { value: 'issue', label: 'Issue' },
  { value: 'commit', label: 'Commit' },
  { value: 'review', label: 'Review' },
  { value: 'release', label: 'Release' },
  { value: 'talk', label: 'Talk' },
  { value: 'video', label: 'Video' },
  { value: 'slides', label: 'Slides' },
  { value: 'article', label: 'Article' },
  { value: 'thread', label: 'Thread' },
  { value: 'dataset', label: 'Dataset' },
  { value: 'edit', label: 'Edit' },
  { value: 'other', label: 'Link' },
];

export const ARTIFACT_LINK_KIND_LABELS: Record<string, string> = Object.fromEntries(
  ARTIFACT_LINK_KIND_OPTIONS.map((o) => [o.value, o.label]),
);

/** Resolve a label for an artifact-link-kind value. Falls back to the raw value. */
export function getArtifactLinkKindLabel(value: string | undefined | null): string | undefined {
  if (!value) return undefined;
  return ARTIFACT_LINK_KIND_LABELS[value] ?? value;
}
