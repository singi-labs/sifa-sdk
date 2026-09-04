/**
 * Shared, single-source-of-truth model for which profile sections render, in
 * what order, their nav grouping, and which items a given viewer may see.
 *
 * Every Sifa profile surface builds on this: the HTML profile page, the
 * Markdown / DOCX / print exports, and the standalone personal-site renderer.
 * Adding a section to {@link ALL_SECTIONS} makes it appear everywhere (the
 * exports drive presence + order from here, and {@link SECTION_LABELS} is an
 * exhaustive `Record<SectionId, string>`, so a new id is a compile error until
 * it has a label).
 *
 * The per-section sorts live in `./section-sorts.js`, built on the same SDK
 * date extractors the HTML section components use, so the surfaces cannot
 * diverge on ordering.
 */

import type { Profile } from '../types/index.js';

/**
 * Side-nav groups, in display order. Each labels a contiguous run of sections
 * in {@link ALL_SECTIONS}. `labelKey` resolves against the consumer's `sections`
 * i18n namespace.
 */
export const SECTION_GROUPS = [
  { id: 'overview', labelKey: 'groupOverview' },
  { id: 'experience', labelKey: 'groupExperience' },
  { id: 'qualifications', labelKey: 'groupQualifications' },
  { id: 'more', labelKey: 'groupMore' },
] as const;

export type SectionGroupId = (typeof SECTION_GROUPS)[number]['id'];

/**
 * Profile body sections in render + nav order (evidence-first): identity and
 * activity lead, then living work (career, projects, talks, publications, then
 * skills), then the formal record (credentials, education, courses), then the
 * rest. `ns` selects the consumer's i18n namespace for `labelKey`; `group`
 * ties the section to a {@link SECTION_GROUPS} header.
 */
export const ALL_SECTIONS = [
  { id: 'about', labelKey: 'about', ns: 'profile' as const, group: 'overview' as const },
  { id: 'career', labelKey: 'career', ns: 'sections' as const, group: 'experience' as const },
  { id: 'projects', labelKey: 'projects', ns: 'sections' as const, group: 'experience' as const },
  {
    id: 'presentations',
    labelKey: 'talksAndSessions',
    ns: 'sections' as const,
    group: 'experience' as const,
  },
  {
    id: 'publications',
    labelKey: 'publications',
    ns: 'sections' as const,
    group: 'experience' as const,
  },
  { id: 'skills', labelKey: 'skills', ns: 'sections' as const, group: 'experience' as const },
  {
    id: 'credentials',
    labelKey: 'credentials',
    ns: 'sections' as const,
    group: 'qualifications' as const,
  },
  {
    id: 'education',
    labelKey: 'education',
    ns: 'sections' as const,
    group: 'qualifications' as const,
  },
  { id: 'courses', labelKey: 'courses', ns: 'sections' as const, group: 'qualifications' as const },
  { id: 'awards', labelKey: 'awards', ns: 'sections' as const, group: 'more' as const },
  { id: 'involvement', labelKey: 'involvement', ns: 'sections' as const, group: 'more' as const },
  // Its own section rather than a group under involvement: that record is about
  // work contributed, this one about capital deployed.
  { id: 'investments', labelKey: 'investments', ns: 'sections' as const, group: 'more' as const },
  { id: 'languages', labelKey: 'languages', ns: 'sections' as const, group: 'more' as const },
  {
    id: 'other-profiles',
    labelKey: 'otherProfiles',
    ns: 'sections' as const,
    group: 'more' as const,
  },
] as const;

/** Every profile section id, in canonical render order. */
export type SectionId = (typeof ALL_SECTIONS)[number]['id'];

/** Whether a section has content for a given profile (used to hide empty nav entries for visitors). */
export function isSectionPopulated(profile: Profile, id: string): boolean {
  switch (id) {
    case 'about':
      return Boolean(profile.about && profile.headline);
    case 'career':
      return Boolean(profile.positions?.length);
    case 'education':
      return Boolean(profile.education?.length);
    case 'courses':
      return Boolean(profile.courses?.length);
    case 'skills':
      return Boolean(profile.skills?.length);
    case 'projects':
      return Boolean(profile.projects?.length);
    case 'credentials':
      return Boolean(profile.certifications?.length);
    case 'publications':
      return Boolean(profile.publications?.length);
    case 'presentations':
      return (
        Boolean(profile.presentations?.length) || Boolean(profile.presentationDeliveries?.length)
      );
    case 'involvement':
      return Boolean(profile.involvement?.length);
    case 'investments':
      return Boolean(profile.investments?.length);
    case 'awards':
      return Boolean(profile.honors?.length);
    case 'languages':
      return Boolean(profile.languages?.length);
    case 'other-profiles':
      return Boolean(profile.externalAccounts?.length);
    default:
      return false;
  }
}

/**
 * The section ids a given viewer should see, in {@link ALL_SECTIONS} order.
 * Owners see every section; visitors only see populated ones.
 */
export function getVisibleSectionIds(profile: Profile, isOwnProfile: boolean): SectionId[] {
  return ALL_SECTIONS.map((s) => s.id).filter(
    (id) => isOwnProfile || isSectionPopulated(profile, id),
  );
}

/** Drop items the owner has hidden from visitors. */
export function filterHidden<T extends { hidden?: boolean }>(items: T[] | undefined): T[] {
  return (items ?? []).filter((i) => !i.hidden);
}

/**
 * Items visible to a given viewer: owners see their own hidden items, visitors
 * do not. Shared by every export format (markdown, docx, print) and the public
 * `.md` route so the hidden rule lives in one place.
 */
export function visibleItems<T extends { hidden?: boolean }>(
  items: T[] | undefined,
  isOwnProfile: boolean,
): T[] {
  return isOwnProfile ? (items ?? []) : filterHidden(items);
}

/**
 * English heading text for each section, keyed by {@link SectionId} (e.g.
 * `other-profiles` renders as "Links"). Exhaustive `Record<SectionId, string>`:
 * adding a section to {@link ALL_SECTIONS} without a label here is a compile
 * error, so a section can never silently render without (or with a stale)
 * heading. Consumers with i18n resolve their own localized labels via
 * `labelKey`; this is the canonical English fallback used by the exports.
 */
export const SECTION_LABELS: Record<SectionId, string> = {
  about: 'About',
  career: 'Career',
  skills: 'Skills',
  projects: 'Projects',
  presentations: 'Talks & sessions',
  publications: 'Publications',
  credentials: 'Credentials',
  education: 'Education',
  courses: 'Courses',
  awards: 'Awards',
  involvement: 'Involvement',
  investments: 'Investments',
  languages: 'Languages',
  'other-profiles': 'Links',
};
