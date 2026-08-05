import { describe, expect, it } from 'vitest';

import { buildBreadcrumbListJsonLd, buildPersonJsonLd, buildProfilePageJsonLd } from './profile.js';

const bsky = { id: 'bluesky' };

// The behaviour in this file was ported from sifa-web's src/lib/jsonld.ts so the
// two surfaces can converge on one implementation. Cases below marked "ported"
// lock in the existing sifa.id output; changing them changes live structured
// data.

describe('buildPersonJsonLd sameAs (ported)', () => {
  it('includes the Bluesky profile URL when activeApps contains bluesky', () => {
    const ld = buildPersonJsonLd({ handle: 'gui.do', activeApps: [bsky] });
    expect(ld.sameAs).toContain('https://bsky.app/profile/gui.do');
  });

  it('omits the Bluesky profile URL when the user has no Bluesky activity', () => {
    const ld = buildPersonJsonLd({
      handle: 'someone.frostsky.fyi',
      website: 'https://example.com',
      activeApps: [{ id: 'frontpage' }],
    });
    expect(ld.sameAs ?? []).not.toContain('https://bsky.app/profile/someone.frostsky.fyi');
  });

  it('omits the Bluesky profile URL when activeApps is undefined', () => {
    const ld = buildPersonJsonLd({ handle: 'gui.do', website: 'https://gui.do' });
    expect(ld.sameAs ?? []).not.toContain('https://bsky.app/profile/gui.do');
  });

  it('prefixes website with https:// when missing', () => {
    const ld = buildPersonJsonLd({ handle: 'test.bsky.social', website: 'example.com' });
    expect(ld.sameAs).toContain('https://example.com');
  });

  it('includes verified account URLs', () => {
    const ld = buildPersonJsonLd({
      handle: 'gui.do',
      activeApps: [bsky],
      verifiedAccounts: [
        { platform: 'github', identifier: 'gxjansen', url: 'https://github.com/gxjansen' },
        {
          platform: 'linkedin',
          identifier: 'gxjansen',
          url: 'https://www.linkedin.com/in/gxjansen/',
        },
      ],
    });
    expect(ld.sameAs).toEqual(
      expect.arrayContaining([
        'https://bsky.app/profile/gui.do',
        'https://github.com/gxjansen',
        'https://www.linkedin.com/in/gxjansen/',
      ]),
    );
  });

  it('deduplicates entries when a verified account URL matches the website', () => {
    const ld = buildPersonJsonLd({
      handle: 'gui.do',
      website: 'https://gui.do',
      verifiedAccounts: [{ platform: 'website', identifier: 'gui.do', url: 'https://gui.do' }],
    });
    expect((ld.sameAs ?? []).filter((u) => u === 'https://gui.do')).toHaveLength(1);
  });

  it('omits verified accounts with no URL', () => {
    const ld = buildPersonJsonLd({
      handle: 'gui.do',
      activeApps: [bsky],
      verifiedAccounts: [{ platform: 'phone', identifier: '+31...', url: undefined }],
    });
    expect(ld.sameAs).toEqual(['https://bsky.app/profile/gui.do']);
  });

  it('produces no sameAs property when there is nothing to link to', () => {
    const ld = buildPersonJsonLd({ handle: 'someone.example.com' });
    expect(ld.sameAs).toBeUndefined();
  });
});

describe('buildPersonJsonLd structured name (ported)', () => {
  it('emits givenName and familyName when both are present', () => {
    const ld = buildPersonJsonLd({
      handle: 'aisha.bsky.social',
      displayName: 'Aisha G.',
      givenName: 'Aisha',
      familyName: 'García-Hernández',
    });
    expect(ld.givenName).toBe('Aisha');
    expect(ld.familyName).toBe('García-Hernández');
  });

  it('uses the structured name for "name" when both halves are set', () => {
    const ld = buildPersonJsonLd({
      handle: 'aisha.bsky.social',
      displayName: 'Some Other Display',
      givenName: 'Aisha',
      familyName: 'García',
    });
    expect(ld.name).toBe('Aisha García');
  });

  it('falls back to displayName when only one half is set', () => {
    const ld = buildPersonJsonLd({
      handle: 'aisha.bsky.social',
      displayName: 'Aisha G.',
      givenName: 'Aisha',
    });
    expect(ld.name).toBe('Aisha G.');
    expect(ld.familyName).toBeUndefined();
  });

  it('trims whitespace and ignores empty strings on both fields', () => {
    const ld = buildPersonJsonLd({
      handle: 'gui.do',
      displayName: 'Guido J.',
      givenName: '   ',
      familyName: '\t',
    });
    expect(ld.givenName).toBeUndefined();
    expect(ld.familyName).toBeUndefined();
    expect(ld.name).toBe('Guido J.');
  });
});

describe('buildPersonJsonLd jobTitle and description (ported)', () => {
  it('reflects the user-flagged primary position', () => {
    const ld = buildPersonJsonLd({
      handle: 'teonbrooks.com',
      positions: [
        { company: 'Meta', title: 'Data Scientist', startedAt: '2025-08' },
        { company: 'Gotham Data Clinic', title: 'President', startedAt: '2023-02', primary: true },
        { company: 'OldCo', title: 'Engineer', startedAt: '2017-11', endedAt: '2022-03' },
      ],
    });
    expect(ld.jobTitle).toBe('President');
  });

  it('falls through an emoji-only headline to the position title', () => {
    const ld = buildPersonJsonLd({
      handle: 'imlunahey.com',
      headline: '🏳️‍⚧️',
      positions: [{ company: 'Axiom.co', title: 'Software Engineer', startedAt: '2025-02' }],
    });
    expect(ld.jobTitle).toBe('Software Engineer');
  });

  it('omits a zero-width or whitespace-only about', () => {
    const ld = buildPersonJsonLd({ handle: 'imlunahey.com', about: '​\n  \t' });
    expect(ld.description).toBeUndefined();
  });
});

describe('buildPersonJsonLd knowsAbout ranking (ported)', () => {
  it('omits knowsAbout when there are no skills', () => {
    expect(buildPersonJsonLd({ handle: 'gui.do' }).knowsAbout).toBeUndefined();
  });

  it('ranks skills by endorsement count descending', () => {
    const ld = buildPersonJsonLd({
      handle: 'gui.do',
      skills: [
        { name: 'React', endorsementCount: 3 },
        { name: 'TypeScript', endorsementCount: 9 },
        { name: 'CSS', endorsementCount: 6 },
      ],
    });
    expect(ld.knowsAbout).toEqual(['TypeScript', 'CSS', 'React']);
  });

  it('breaks ties by preserving input order', () => {
    const ld = buildPersonJsonLd({
      handle: 'gui.do',
      skills: [
        { name: 'Rust', endorsementCount: 4 },
        { name: 'Go', endorsementCount: 4 },
        { name: 'Elm', endorsementCount: 4 },
      ],
    });
    expect(ld.knowsAbout).toEqual(['Rust', 'Go', 'Elm']);
  });

  it('treats a missing endorsement count as zero', () => {
    const ld = buildPersonJsonLd({
      handle: 'gui.do',
      skills: [{ name: 'NoCount' }, { name: 'Endorsed', endorsementCount: 5 }],
    });
    expect(ld.knowsAbout).toEqual(['Endorsed', 'NoCount']);
  });

  it('caps knowsAbout at the top 20 skills', () => {
    const skills = Array.from({ length: 40 }, (_, i) => ({
      name: `Skill ${String(i).padStart(2, '0')}`,
      endorsementCount: 40 - i,
    }));
    const ld = buildPersonJsonLd({ handle: 'gui.do', skills });
    expect(ld.knowsAbout).toHaveLength(20);
    expect(ld.knowsAbout?.[0]).toBe('Skill 00');
    expect(ld.knowsAbout?.[19]).toBe('Skill 19');
  });

  it('drops skills with no name', () => {
    const ld = buildPersonJsonLd({
      handle: 'gui.do',
      skills: [{ name: 'React', endorsementCount: 2 }, { name: '' }, { name: 'CSS' }],
    });
    expect(ld.knowsAbout).toEqual(['React', 'CSS']);
  });
});

describe('buildProfilePageJsonLd (ported)', () => {
  it('omits dateModified when no last-edit timestamp is available', () => {
    expect(buildProfilePageJsonLd({ handle: 'gui.do' }).dateModified).toBeUndefined();
  });

  it('uses a profile-level updatedAt when present', () => {
    const ld = buildProfilePageJsonLd({ handle: 'gui.do', updatedAt: '2024-06-01T00:00:00.000Z' });
    expect(ld.dateModified).toBe('2024-06-01T00:00:00.000Z');
  });

  it('nests the Person as mainEntity without a duplicate @context', () => {
    const ld = buildProfilePageJsonLd({ handle: 'gui.do', displayName: 'Guido' });
    expect(ld['@type']).toBe('ProfilePage');
    expect(ld.mainEntity['@type']).toBe('Person');
    expect('@context' in ld.mainEntity).toBe(false);
  });
});

describe('buildBreadcrumbListJsonLd (ported)', () => {
  it('emits a two-step trail rooted at sifa.id', () => {
    const ld = buildBreadcrumbListJsonLd({ handle: 'gui.do', displayName: 'Guido X Jansen' });
    expect(ld['@context']).toBe('https://schema.org');
    expect(ld['@type']).toBe('BreadcrumbList');
    expect(ld.itemListElement).toEqual([
      { '@type': 'ListItem', position: 1, name: 'Sifa', item: 'https://sifa.id/' },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Guido X Jansen',
        item: 'https://sifa.id/p/gui.do',
      },
    ]);
  });

  it('falls back to the handle when displayName is absent', () => {
    const ld = buildBreadcrumbListJsonLd({ handle: 'gui.do' });
    expect(ld.itemListElement[1]?.name).toBe('gui.do');
  });

  it('passes the leaf name through the sanitizer', () => {
    const ld = buildBreadcrumbListJsonLd(
      { handle: 'gui.do', displayName: '<script>x</script>' },
      { sanitize: (s) => s.replace(/[<>]/g, '') },
    );
    expect(ld.itemListElement[1]?.name).toBe('scriptx/script');
  });
});

// New behaviour below. The SDK serves sifa.id and page.sifa.id, which today
// emit different Person graphs from two hand-written implementations.

describe('baseUrl option', () => {
  it('defaults to sifa.id so ported output is unchanged', () => {
    expect(buildPersonJsonLd({ handle: 'gui.do' }).url).toBe('https://sifa.id/p/gui.do');
  });

  it('honours an alternative canonical host', () => {
    const ld = buildPersonJsonLd({ handle: 'gui.do' }, { baseUrl: 'https://page.sifa.id' });
    expect(ld.url).toBe('https://page.sifa.id/p/gui.do');
  });

  it('tolerates a trailing slash on the supplied base URL', () => {
    const ld = buildPersonJsonLd({ handle: 'gui.do' }, { baseUrl: 'https://page.sifa.id/' });
    expect(ld.url).toBe('https://page.sifa.id/p/gui.do');
  });

  it('strips a long run of trailing slashes in linear time', () => {
    // The input shape behind CodeQL js/polynomial-redos: normaliseBaseUrl scans
    // rather than using /\/+$/, so this stays linear.
    const ld = buildPersonJsonLd(
      { handle: 'gui.do' },
      { baseUrl: `https://page.sifa.id${'/'.repeat(50_000)}` },
    );
    expect(ld.url).toBe('https://page.sifa.id/p/gui.do');
  });
});

describe('owner-hidden items never reach structured data', () => {
  // The AppView flags hidden items rather than dropping them, so a consumer
  // that forgets to filter would publish something the owner chose to hide.
  // Filtering here makes the emitter correct regardless of caller.
  it('excludes hidden positions from worksFor and jobTitle', () => {
    const ld = buildPersonJsonLd({
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
    expect(JSON.stringify(ld)).not.toContain('SecretCo');
    expect(ld.jobTitle).toBe('Engineer');
  });

  it('excludes hidden skills from knowsAbout', () => {
    const ld = buildPersonJsonLd({
      handle: 'gui.do',
      skills: [
        { name: 'Hidden', endorsementCount: 99, hidden: true },
        { name: 'Shown', endorsementCount: 1 },
      ],
    });
    expect(ld.knowsAbout).toEqual(['Shown']);
  });

  it('excludes hidden education, certifications, honors and languages', () => {
    const ld = buildPersonJsonLd({
      handle: 'gui.do',
      education: [{ institution: 'HiddenU', degree: 'BSc', hidden: true }],
      certifications: [{ name: 'HiddenCert', hidden: true }],
      honors: [{ title: 'HiddenAward', hidden: true }],
      languages: [{ language: 'Klingon', hidden: true }],
    });
    const serialized = JSON.stringify(ld);
    expect(serialized).not.toContain('HiddenU');
    expect(serialized).not.toContain('HiddenCert');
    expect(serialized).not.toContain('HiddenAward');
    expect(serialized).not.toContain('Klingon');
  });
});

describe('sanitizer coverage', () => {
  it('passes user-authored strings through the sanitizer', () => {
    const strip = (s: string) => s.replace(/[<>]/g, '');
    const ld = buildPersonJsonLd(
      {
        handle: 'gui.do',
        displayName: '<b>Name</b>',
        about: '<i>About</i>',
        headline: '<u>Head</u>',
        positions: [{ company: '<s>Co</s>', title: '<em>Title</em>', startedAt: '2024-01' }],
      },
      { sanitize: strip },
    );
    expect(JSON.stringify(ld)).not.toMatch(/[<>]/);
  });
});
