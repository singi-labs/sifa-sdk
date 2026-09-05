import { describe, expect, expectTypeOf, it } from 'vitest';
import type { SkillView } from './profile-view.js';

// The AppView serves an endorsement summary on every skill (endorsementCount,
// endorsed, endorsedAs) plus the record cid. SkillView must describe them so
// TS consumers can read the data without casting. (sifa-workspace#515)
describe('SkillView', () => {
  it('carries the endorsement summary and record cid', () => {
    const skill: SkillView = {
      rkey: 'r1',
      name: 'TypeScript',
      cid: 'bafyexample',
      endorsementCount: 3,
      endorsed: true,
      endorsedAs: ['TS'],
    };
    expect(skill.endorsementCount).toBe(3);
    expect(skill.endorsedAs).toEqual(['TS']);
  });

  it('types the new fields as optional', () => {
    expectTypeOf<SkillView['cid']>().toEqualTypeOf<string | undefined>();
    expectTypeOf<SkillView['endorsementCount']>().toEqualTypeOf<number | undefined>();
    expectTypeOf<SkillView['endorsed']>().toEqualTypeOf<boolean | undefined>();
    expectTypeOf<SkillView['endorsedAs']>().toEqualTypeOf<string[] | undefined>();
  });
});
