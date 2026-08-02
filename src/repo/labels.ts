/**
 * One line of text identifying a record to the person who wrote it.
 *
 * Split into parts rather than one joined string: joining needs a connective
 * ("Senior Engineer at Acme") and a connective is copy, which is translated at
 * the surface. Every value here comes straight from the user's own record, so
 * the SDK contributes no language of its own.
 */
export interface RepoRecordLabel {
  /** The record's own identifying text, or the collection leaf when it has none. */
  primary: string;
  /** Employer, institution, event, or publisher, when the record names one. */
  secondary?: string;
  /** The date the record is about, not when it was written. May be partial ("2021-03"). */
  date?: string;
  /**
   * The person a record is about, for records whose meaning is a relationship
   * rather than text: endorsements, follows, confirmations, attestations.
   *
   * Kept out of {@link primary} so a surface can resolve it to a handle and
   * avatar without parsing a DID back out of display text.
   */
  subjectDid?: string;
}

interface LabelRule {
  /** Candidate fields for {@link RepoRecordLabel.primary}, first non-blank wins. */
  primary?: readonly string[];
  secondary?: readonly string[];
  date?: readonly string[];
  subjectDid?: readonly string[];
}

/**
 * Which fields carry the identifying text, per collection.
 *
 * A table rather than a function per lexicon: the extraction is the same shape
 * every time, and 30 near-identical functions would hide the two or three that
 * genuinely differ.
 *
 * Collections absent from this table fall back to the collection leaf. That is
 * the right answer for records with nothing human-readable in them at all --
 * consent grants, access tokens -- which is most of what is missing here.
 */
const LABEL_RULES: Readonly<Record<string, LabelRule>> = {
  'id.sifa.profile.self': { primary: ['headline'] },
  'id.sifa.profile.location': { primary: ['locality', 'region', 'country'] },
  'id.sifa.profile.language': { primary: ['name'], secondary: ['proficiency'] },
  'id.sifa.profile.externalAccount': { primary: ['label', 'platform'], secondary: ['url'] },
  'id.sifa.org.profile': { primary: ['name'] },

  'id.sifa.profile.position': {
    primary: ['title'],
    secondary: ['company'],
    date: ['startedAt'],
  },
  'id.sifa.profile.volunteering': {
    primary: ['role', 'organization'],
    secondary: ['organization'],
    date: ['startedAt'],
  },
  'id.sifa.org.employmentAttestation': {
    primary: ['title'],
    date: ['startedAt'],
    subjectDid: ['subject'],
  },

  'id.sifa.profile.education': {
    primary: ['degree', 'fieldOfStudy'],
    secondary: ['institution'],
    date: ['startedAt'],
  },
  'id.sifa.profile.course': {
    primary: ['name'],
    secondary: ['institution'],
    date: ['completedAt'],
  },
  'id.sifa.profile.certification': {
    primary: ['name'],
    secondary: ['authority'],
    date: ['issuedAt'],
  },

  'id.sifa.profile.skill': { primary: ['name'], secondary: ['category'] },
  'id.sifa.endorsement': { primary: ['skillName'], subjectDid: ['subject'] },
  'id.sifa.endorsement.confirmation': { primary: ['skill'] },

  'id.sifa.profile.project': {
    primary: ['title', 'name'],
    secondary: ['role'],
    date: ['startedAt'],
  },
  'id.sifa.profile.involvement': {
    primary: ['role', 'upstream'],
    secondary: ['upstream'],
    date: ['startedAt'],
  },
  'id.sifa.project.self': { primary: ['name', 'title'] },
  'id.sifa.project.member': { primary: ['role'], subjectDid: ['subject', 'did'] },
  'id.sifa.project.membership': { primary: ['role'], subjectDid: ['subject', 'did'] },

  'id.sifa.profile.publication': {
    primary: ['title', 'name'],
    secondary: ['publisher'],
    date: ['publishedAt'],
  },
  'id.sifa.profile.presentation': { primary: ['title', 'label'] },
  'id.sifa.profile.presentationDelivery': {
    primary: ['title'],
    secondary: ['eventName'],
    date: ['date'],
  },
  'id.sifa.profile.honor': { primary: ['title'], secondary: ['issuer'], date: ['awardedAt'] },

  'id.sifa.graph.follow': { subjectDid: ['subject'] },
  'id.sifa.graph.connection': { subjectDid: ['subject'] },
  'id.sifa.confirmation': {
    primary: ['subjectName'],
    secondary: ['relation'],
    subjectDid: ['subject'],
  },
};

/** The part of an NSID after the last dot: "id.sifa.profile.position" -> "position". */
function collectionLeaf(collection: string): string {
  return collection.slice(collection.lastIndexOf('.') + 1);
}

/**
 * First field holding a non-blank string, or undefined.
 *
 * Non-strings are skipped rather than coerced: a record that fails validation
 * still reaches this page (it is in the repo, so the user can see and delete
 * it), and "[object Object]" as a label helps nobody.
 */
function pickString(
  record: Record<string, unknown>,
  fields: readonly string[],
): string | undefined {
  for (const field of fields) {
    const raw = record[field];
    if (typeof raw !== 'string') continue;
    const trimmed = raw.trim();
    if (trimmed.length > 0) return trimmed;
  }
  return undefined;
}

/**
 * Describe one record from the user's repo in terms they will recognise.
 *
 * Never throws and never returns an empty primary. This runs over whatever is
 * actually in the repo, including records written by older versions of Sifa and
 * records hand-edited elsewhere. A page that crashes on one malformed record
 * would hide the rest, which is exactly the data the user came to manage.
 */
export function describeSifaRecord(collection: string, value: unknown): RepoRecordLabel {
  const leaf = collectionLeaf(collection);
  const rule = LABEL_RULES[collection];
  if (!rule || typeof value !== 'object' || value === null) return { primary: leaf };

  const record = value as Record<string, unknown>;
  const label: RepoRecordLabel = {
    primary: (rule.primary && pickString(record, rule.primary)) ?? leaf,
  };

  const secondary = rule.secondary && pickString(record, rule.secondary);
  if (secondary !== undefined && secondary !== label.primary) label.secondary = secondary;

  const date = rule.date && pickString(record, rule.date);
  if (date !== undefined) label.date = date;

  const subjectDid = rule.subjectDid && pickString(record, rule.subjectDid);
  if (subjectDid !== undefined) label.subjectDid = subjectDid;

  return label;
}
