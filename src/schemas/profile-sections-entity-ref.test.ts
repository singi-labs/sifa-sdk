import { describe, expect, it } from 'vitest';

import { ProfileCertificationRecordSchema } from './profile-certification.js';
import { ProfileCourseRecordSchema } from './profile-course.js';
import { ProfileEducationRecordSchema } from './profile-education.js';
import { ProfileHonorRecordSchema } from './profile-honor.js';
import { ProfileVolunteeringRecordSchema } from './profile-volunteering.js';

const NOW = '2026-05-15T10:00:00.000Z';

// The five other org-bearing sections carry the same entityRef pointer as
// id.sifa.profile.position (#241): an optional, http(s)-constrained portable
// org identifier. Each `base` is a minimal valid record for that section.
const sections = [
  {
    name: 'education',
    schema: ProfileEducationRecordSchema,
    base: { institution: 'TU Delft', createdAt: NOW },
  },
  {
    name: 'volunteering',
    schema: ProfileVolunteeringRecordSchema,
    base: { organization: 'Red Cross', createdAt: NOW },
  },
  {
    name: 'certification',
    schema: ProfileCertificationRecordSchema,
    base: { name: 'AWS SAA', createdAt: NOW },
  },
  { name: 'course', schema: ProfileCourseRecordSchema, base: { name: 'CS101', createdAt: NOW } },
  {
    name: 'honor',
    schema: ProfileHonorRecordSchema,
    base: { title: 'Best Engineer', createdAt: NOW },
  },
] as const;

describe.each(sections)('$name entityRef', ({ schema, base }) => {
  it('accepts an http(s) entityRef', () => {
    const parsed = schema.parse({ ...base, entityRef: 'http://www.wikidata.org/entity/Q9001' });
    expect(parsed.entityRef).toBe('http://www.wikidata.org/entity/Q9001');
  });

  it('rejects a javascript: scheme entityRef', () => {
    expect(() => schema.parse({ ...base, entityRef: 'javascript:alert(1)' })).toThrow();
  });

  it('rejects an entityRef over 2048 characters', () => {
    const longRef = `https://example.com/${'x'.repeat(2048)}`;
    expect(() => schema.parse({ ...base, entityRef: longRef })).toThrow();
  });

  it('is optional (free-text entry)', () => {
    expect(schema.parse(base).entityRef).toBeUndefined();
  });
});
