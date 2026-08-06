import { describe, expect, it } from 'vitest';

import { buildProfileWorksJsonLd } from './works-graph.js';

const author = { handle: 'gui.do', displayName: 'Guido X Jansen' };
const PERSON_ID = 'https://sifa.id/p/gui.do';

describe('buildProfileWorksJsonLd', () => {
  it('returns null when the profile has no works, so no empty block is emitted', () => {
    expect(buildProfileWorksJsonLd({ handle: 'gui.do' }, author)).toBeNull();
  });

  it('emits a @graph containing each work', () => {
    const ld = buildProfileWorksJsonLd(
      {
        handle: 'gui.do',
        publications: [{ rkey: 'p1', title: 'A paper' }],
        presentations: [{ rkey: 't1', title: 'A talk' }],
        courses: [{ rkey: 'c1', name: 'A course' }],
        projects: [{ rkey: 'j1', name: 'A project' }],
      },
      author,
    );
    expect(ld?.['@context']).toBe('https://schema.org');
    expect(ld?.['@graph'].map((n) => n['@type'])).toEqual([
      'ScholarlyArticle',
      'PresentationDigitalDocument',
      'Course',
      'Project',
    ]);
  });

  it('references the Person by @id rather than repeating the whole node', () => {
    // The Person is already emitted in full by the ProfilePage block. Repeating
    // it here would give a crawler two Person nodes for one person to reconcile.
    const ld = buildProfileWorksJsonLd(
      { handle: 'gui.do', publications: [{ rkey: 'p1', title: 'A paper' }] },
      author,
    );
    expect(ld?.['@graph'][0]).toMatchObject({ author: [{ '@id': PERSON_ID }] });
  });

  it('honours canonicalUrl for the Person reference', () => {
    const ld = buildProfileWorksJsonLd(
      { handle: 'gui.do', publications: [{ rkey: 'p1', title: 'A paper' }] },
      author,
      { canonicalUrl: 'https://alice.example/' },
    );
    expect(ld?.['@graph'][0]).toMatchObject({ author: [{ '@id': 'https://alice.example/' }] });
  });

  it('excludes hidden works', () => {
    const ld = buildProfileWorksJsonLd(
      {
        handle: 'gui.do',
        publications: [
          { rkey: 'p1', title: 'Public paper' },
          { rkey: 'p2', title: 'Secret paper', hidden: true },
        ],
        projects: [{ rkey: 'j1', name: 'Secret project', hidden: true }],
      },
      author,
    );
    const serialized = JSON.stringify(ld);
    expect(serialized).toContain('Public paper');
    expect(serialized).not.toContain('Secret paper');
    expect(serialized).not.toContain('Secret project');
  });

  it('returns null when every work is hidden', () => {
    const ld = buildProfileWorksJsonLd(
      { handle: 'gui.do', publications: [{ rkey: 'p1', title: 'Hidden', hidden: true }] },
      author,
    );
    expect(ld).toBeNull();
  });

  it('keeps a publication DOI', () => {
    const ld = buildProfileWorksJsonLd(
      { handle: 'gui.do', publications: [{ rkey: 'p1', title: 'A paper', doi: '10.1234/x' }] },
      author,
    );
    expect(ld?.['@graph'][0]).toMatchObject({
      identifier: { '@type': 'PropertyValue', propertyID: 'DOI', value: '10.1234/x' },
    });
  });

  it('carries a talk delivery through as an Event', () => {
    const ld = buildProfileWorksJsonLd(
      {
        handle: 'gui.do',
        presentations: [
          {
            rkey: 't1',
            title: 'A talk',
            deliveries: [{ rkey: 'd1', eventName: 'AtmosphereConf', date: '2026-03-20' }],
          },
        ],
      },
      author,
    );
    expect(ld?.['@graph'][0]).toMatchObject({
      subjectOf: [{ '@type': 'Event', name: 'AtmosphereConf', startDate: '2026-03-20' }],
    });
  });

  it('applies the sanitizer', () => {
    const ld = buildProfileWorksJsonLd(
      { handle: 'gui.do', publications: [{ rkey: 'p1', title: '<b>Paper</b>' }] },
      author,
      { sanitize: (s) => s.replace(/[<>]/g, '') },
    );
    expect(JSON.stringify(ld)).not.toMatch(/[<>]/);
  });
});
