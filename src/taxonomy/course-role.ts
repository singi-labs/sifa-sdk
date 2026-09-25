/**
 * Course-role taxonomy. Mirrors `id.sifa.defs#courseRole.knownValues` from
 * sifa-lexicons. A course record without a role is a course the user took;
 * taught and assisted courses render under the "Teaching" heading.
 */

export interface CourseRoleOption {
  value: string;
  label: string;
}

export const COURSE_ROLE_TAKEN = 'id.sifa.defs#courseTaken';
export const COURSE_ROLE_TAUGHT = 'id.sifa.defs#courseTaught';
export const COURSE_ROLE_TEACHING_ASSISTANT = 'id.sifa.defs#courseTeachingAssistant';

export const COURSE_ROLE_OPTIONS: CourseRoleOption[] = [
  { value: COURSE_ROLE_TAKEN, label: 'Student' },
  { value: COURSE_ROLE_TAUGHT, label: 'Instructor' },
  { value: COURSE_ROLE_TEACHING_ASSISTANT, label: 'Teaching assistant' },
];

export const COURSE_ROLE_LABELS: Record<string, string> = Object.fromEntries(
  COURSE_ROLE_OPTIONS.map((o) => [o.value, o.label]),
);

/**
 * Resolve the label for a course-role token. An unknown token resolves to
 * `undefined` rather than the raw value, so a token a client has not learned
 * never shows up as a raw `id.sifa.defs#...` string.
 */
export function getCourseRoleLabel(value: string | undefined | null): string | undefined {
  if (!value) return undefined;
  return COURSE_ROLE_LABELS[value];
}

const TEACHING_ROLES = new Set([COURSE_ROLE_TAUGHT, COURSE_ROLE_TEACHING_ASSISTANT]);

/**
 * Whether a course is one the user taught or assisted with. An absent, taken,
 * or unknown role counts as taken, so a record is never dropped from the
 * profile when a client meets a token it has not learned.
 */
export function isTeachingCourse(course: { role?: string | null }): boolean {
  return !!course.role && TEACHING_ROLES.has(course.role);
}

/** Split courses into the ones taken and the ones taught or assisted, keeping order. */
export function splitCoursesByRole<T extends { role?: string | null }>(
  courses: readonly T[],
): { taken: T[]; teaching: T[] } {
  const taken: T[] = [];
  const teaching: T[] = [];
  for (const c of courses) (isTeachingCourse(c) ? teaching : taken).push(c);
  return { taken, teaching };
}
