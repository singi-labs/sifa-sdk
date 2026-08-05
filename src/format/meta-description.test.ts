import { describe, expect, it } from 'vitest';

import { buildMetaDescription } from './meta-description.js';

// Ported from sifa-web's src/lib/jsonld.ts so the meta description and the
// JSON-LD jobTitle are derived from one place and cannot disagree about which
// position is current.

describe('buildMetaDescription', () => {
  const teonLikePositions = [
    // Insertion order puts Meta first, which is what a "first active" rule picked.
    { company: 'Meta', title: 'Data Scientist', startedAt: '2025-08' },
    { company: 'Gotham Data Clinic', title: 'President', startedAt: '2023-02', primary: true },
    { company: 'OldCo', title: 'Engineer', startedAt: '2017-11', endedAt: '2022-03' },
  ];

  it('honours the user-flagged primary position', () => {
    const desc = buildMetaDescription({ handle: 'teonbrooks.com', positions: teonLikePositions });
    expect(desc).toContain('President at Gotham Data Clinic');
    expect(desc).not.toContain('Data Scientist at Meta');
  });

  it('falls back to most-recent startedAt when no primary is flagged', () => {
    const desc = buildMetaDescription({
      handle: 'someone',
      positions: teonLikePositions.map((p) => ({ ...p, primary: undefined })),
    });
    expect(desc).toContain('Data Scientist at Meta');
  });

  it('skips an emoji-only headline', () => {
    const desc = buildMetaDescription({
      handle: 'imlunahey.com',
      headline: '🏳️‍⚧️',
      positions: [{ company: 'Axiom.co', title: 'Software Engineer', startedAt: '2025-02' }],
    });
    expect(desc).not.toContain('🏳️‍⚧️');
    expect(desc).toContain('Software Engineer at Axiom.co');
  });

  it('joins headline, position and location with a middot', () => {
    const desc = buildMetaDescription({
      handle: 'gui.do',
      headline: 'Community lead',
      positions: [{ company: 'Singi Labs', title: 'Founder', startedAt: '2026-03' }],
      location: { country: 'Netherlands', locality: 'Utrecht' },
    });
    expect(desc).toBe('Community lead · Founder at Singi Labs · Utrecht, Netherlands');
  });

  it('falls back to a name-only sentence when nothing else is set', () => {
    expect(buildMetaDescription({ handle: 'gui.do', displayName: 'Guido' })).toBe('Guido on Sifa');
    expect(buildMetaDescription({ handle: 'gui.do' })).toBe('gui.do on Sifa');
  });

  it('omits the company clause when a position has no company', () => {
    const desc = buildMetaDescription({
      handle: 'freelance.example',
      positions: [{ title: 'Independent Consultant', startedAt: '2024-01' }],
    });
    expect(desc).toBe('Independent Consultant');
  });

  it('excludes hidden positions', () => {
    const desc = buildMetaDescription({
      handle: 'gui.do',
      positions: [
        {
          company: 'SecretCo',
          title: 'Consultant',
          startedAt: '2025-01',
          primary: true,
          hidden: true,
        },
        { company: 'PublicCo', title: 'Engineer', startedAt: '2024-01' },
      ],
    });
    expect(desc).not.toContain('SecretCo');
    expect(desc).toContain('Engineer at PublicCo');
  });
});
