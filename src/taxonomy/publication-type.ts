/**
 * Publication-type taxonomy. Mirrors `id.sifa.profile.publication.type`
 * `knownValues` from sifa-lexicons.
 *
 * The values are ORCID's work-type vocabulary rather than `id.sifa.defs` tokens,
 * unlike every other enum here. That is deliberate: the vocabulary is ORCID's,
 * not Sifa's. It is what the data arrives in and what the AppView stores and
 * serves unmapped, so a synced work round-trips with no translation table.
 * Minting Sifa tokens would make Sifa the owner of a bibliographic vocabulary it
 * did not design. COAR Resource Types stays the anchor a consumer maps to.
 *
 * The set is open. A publication that reached Sifa from Standard.site, RSS, or a
 * hand-typed entry need not fit ORCID's list, so an unknown value is kept as
 * written rather than dropped.
 */

export interface PublicationTypeOption {
  value: string;
  label: string;
}

export const PUBLICATION_TYPE_OPTIONS: PublicationTypeOption[] = [
  { value: 'journal-article', label: 'Journal Article' },
  { value: 'conference-paper', label: 'Conference Paper' },
  { value: 'conference-abstract', label: 'Conference Abstract' },
  { value: 'conference-poster', label: 'Conference Poster' },
  { value: 'book', label: 'Book' },
  { value: 'book-chapter', label: 'Book Chapter' },
  { value: 'book-review', label: 'Book Review' },
  { value: 'edited-book', label: 'Edited Book' },
  { value: 'dissertation', label: 'Dissertation' },
  { value: 'preprint', label: 'Preprint' },
  { value: 'dataset', label: 'Dataset' },
  { value: 'report', label: 'Report' },
  { value: 'review', label: 'Review' },
  { value: 'patent', label: 'Patent' },
  { value: 'software', label: 'Software' },
  { value: 'working-paper', label: 'Working Paper' },
  { value: 'artistic-performance', label: 'Artistic Performance' },
  { value: 'lecture-speech', label: 'Lecture/Speech' },
  { value: 'online-resource', label: 'Online Resource' },
  { value: 'newspaper-article', label: 'Newspaper Article' },
  { value: 'research-technique', label: 'Research Technique' },
  { value: 'standards-and-policy', label: 'Standards & Policy' },
  { value: 'technical-standard', label: 'Technical Standard' },
  { value: 'registered-copyright', label: 'Registered Copyright' },
  { value: 'translation', label: 'Translation' },
  { value: 'dictionary-entry', label: 'Dictionary Entry' },
  { value: 'encyclopedia-entry', label: 'Encyclopedia Entry' },
  { value: 'supervised-student-publication', label: 'Supervised Student Publication' },
  { value: 'annotation', label: 'Annotation' },
  { value: 'test', label: 'Test' },
  { value: 'spin-off-company', label: 'Spin-off Company' },
  { value: 'disclosure', label: 'Disclosure' },
  { value: 'license', label: 'License' },
  { value: 'trademark', label: 'Trademark' },
  { value: 'design', label: 'Design' },
  // ORCID's catch-all. Labelled "Publication" rather than "Other" because it is
  // what shows on the card, and a badge reading "Other" tells a reader nothing.
  { value: 'other', label: 'Publication' },
];

export const PUBLICATION_TYPE_LABELS: Record<string, string> = Object.fromEntries(
  PUBLICATION_TYPE_OPTIONS.map((o) => [o.value, o.label]),
);

/**
 * Resolve a label for a publication type.
 *
 * An unrecognized value falls back to the generic label rather than being shown
 * raw: an ORCID work type is a slug, and rendering "spin-off-company" verbatim
 * on a card reads as a bug. A caller that wants the raw value already has it.
 */
export function getPublicationTypeLabel(value: string | undefined | null): string | undefined {
  if (!value) return undefined;
  return PUBLICATION_TYPE_LABELS[value] ?? 'Publication';
}
