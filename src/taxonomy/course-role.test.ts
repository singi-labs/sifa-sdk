import { describe, it, expect } from 'vitest';
import {
  COURSE_ROLE_OPTIONS,
  getCourseRoleLabel,
  isTeachingCourse,
  splitCoursesByRole,
} from './course-role.js';

describe('course role taxonomy', () => {
  it('mirrors the id.sifa.defs#courseRole known values', () => {
    expect(COURSE_ROLE_OPTIONS.map((o) => o.value)).toEqual([
      'id.sifa.defs#courseTaken',
      'id.sifa.defs#courseTaught',
      'id.sifa.defs#courseTeachingAssistant',
    ]);
  });

  it('labels a token and never leaks the raw NSID for a known value', () => {
    expect(getCourseRoleLabel('id.sifa.defs#courseTaught')).toBe('Instructor');
    expect(getCourseRoleLabel('id.sifa.defs#courseTeachingAssistant')).toBe('Teaching assistant');
    expect(getCourseRoleLabel(undefined)).toBeUndefined();
  });

  it('treats taught and assisted courses as teaching; absent or taken as taken', () => {
    expect(isTeachingCourse({ role: 'id.sifa.defs#courseTaught' })).toBe(true);
    expect(isTeachingCourse({ role: 'id.sifa.defs#courseTeachingAssistant' })).toBe(true);
    expect(isTeachingCourse({ role: 'id.sifa.defs#courseTaken' })).toBe(false);
    expect(isTeachingCourse({})).toBe(false);
    // An unknown future token stays with taken courses rather than disappearing.
    expect(isTeachingCourse({ role: 'id.sifa.defs#courseSomethingNew' })).toBe(false);
  });

  it('splits courses by role, keeping order', () => {
    const courses = [
      { rkey: 'a' },
      { rkey: 'b', role: 'id.sifa.defs#courseTaught' },
      { rkey: 'c', role: 'id.sifa.defs#courseTaken' },
      { rkey: 'd', role: 'id.sifa.defs#courseTeachingAssistant' },
    ];
    const { taken, teaching } = splitCoursesByRole(courses);
    expect(taken.map((c) => c.rkey)).toEqual(['a', 'c']);
    expect(teaching.map((c) => c.rkey)).toEqual(['b', 'd']);
  });
});
