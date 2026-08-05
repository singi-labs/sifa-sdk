import { describe, expect, it } from 'vitest';

import {
  buildCourseJsonLd,
  buildPresentationJsonLd,
  buildProjectJsonLd,
  buildPublicationJsonLd,
} from './works.js';

const speaker = { handle: 'gui.do', displayName: 'Guido X Jansen' };

describe('buildPresentationJsonLd', () => {
  const talk = {
    rkey: '3ltalk',
    title: 'Portable reputation on the AT Protocol',
    description: 'What a CV looks like when nobody owns it.',
    duration: { minMinutes: 30, maxMinutes: 45 },
  };

  it('emits a PresentationDigitalDocument, not a bare CreativeWork', () => {
    const ld = buildPresentationJsonLd(talk, speaker);
    expect(ld['@type']).toBe('PresentationDigitalDocument');
    expect(ld.name).toBe('Portable reputation on the AT Protocol');
    expect(ld.abstract).toBe('What a CV looks like when nobody owns it.');
  });

  it('attributes the talk to its speaker', () => {
    const ld = buildPresentationJsonLd(talk, speaker);
    expect(ld.author).toEqual({
      '@type': 'Person',
      name: 'Guido X Jansen',
      url: 'https://sifa.id/p/gui.do',
    });
  });

  it('emits the minimum duration as an ISO 8601 duration', () => {
    expect(buildPresentationJsonLd(talk, speaker).timeRequired).toBe('PT30M');
  });

  it('omits timeRequired when no duration is recorded', () => {
    const ld = buildPresentationJsonLd({ ...talk, duration: null }, speaker);
    expect(ld.timeRequired).toBeUndefined();
  });

  it('links to the canonical talk URL', () => {
    expect(buildPresentationJsonLd(talk, speaker).url).toContain('/p/gui.do/talk/');
  });

  describe('deliveries become Events', () => {
    const delivered = {
      ...talk,
      deliveries: [
        {
          rkey: 'd1',
          eventName: 'AtmosphereConf 2026',
          date: '2026-03-20',
          role: 'id.sifa.defs#keynote',
          mode: 'community.lexicon.calendar.event#inperson',
          status: 'community.lexicon.calendar.event#scheduled',
          locationLocality: 'Seattle',
          countryCode: 'US',
        },
      ],
    };

    it('emits each delivery as a subjectOf Event', () => {
      const ld = buildPresentationJsonLd(delivered, speaker);
      expect(ld.subjectOf).toHaveLength(1);
      const event = ld.subjectOf![0]!;
      expect(event['@type']).toBe('Event');
      expect(event.name).toBe('AtmosphereConf 2026');
      expect(event.startDate).toBe('2026-03-20');
    });

    it('maps mode to the schema.org attendance-mode enumeration', () => {
      const ld = buildPresentationJsonLd(delivered, speaker);
      expect(ld.subjectOf![0]!.eventAttendanceMode).toBe(
        'https://schema.org/OfflineEventAttendanceMode',
      );
    });

    it('maps status to the schema.org event-status enumeration', () => {
      const ld = buildPresentationJsonLd(delivered, speaker);
      expect(ld.subjectOf![0]!.eventStatus).toBe('https://schema.org/EventScheduled');
    });

    it.each([
      ['community.lexicon.calendar.event#virtual', 'https://schema.org/OnlineEventAttendanceMode'],
      ['community.lexicon.calendar.event#hybrid', 'https://schema.org/MixedEventAttendanceMode'],
    ])('maps %s', (mode, expected) => {
      const ld = buildPresentationJsonLd(
        { ...delivered, deliveries: [{ ...delivered.deliveries[0]!, mode }] },
        speaker,
      );
      expect(ld.subjectOf![0]!.eventAttendanceMode).toBe(expected);
    });

    it.each([
      ['community.lexicon.calendar.event#cancelled', 'https://schema.org/EventCancelled'],
      ['community.lexicon.calendar.event#postponed', 'https://schema.org/EventPostponed'],
      ['community.lexicon.calendar.event#rescheduled', 'https://schema.org/EventRescheduled'],
    ])('maps %s', (status, expected) => {
      const ld = buildPresentationJsonLd(
        { ...delivered, deliveries: [{ ...delivered.deliveries[0]!, status }] },
        speaker,
      );
      expect(ld.subjectOf![0]!.eventStatus).toBe(expected);
    });

    it('leaves an unrecognised mode or status off rather than guessing', () => {
      const ld = buildPresentationJsonLd(
        {
          ...delivered,
          deliveries: [{ ...delivered.deliveries[0]!, mode: 'something.else#new', status: 'x#y' }],
        },
        speaker,
      );
      expect(ld.subjectOf![0]!.eventAttendanceMode).toBeUndefined();
      expect(ld.subjectOf![0]!.eventStatus).toBeUndefined();
    });

    it('emits a structured place from the location fields', () => {
      const ld = buildPresentationJsonLd(delivered, speaker);
      expect(ld.subjectOf![0]!.location).toEqual({
        '@type': 'Place',
        address: { '@type': 'PostalAddress', addressLocality: 'Seattle', addressCountry: 'US' },
      });
    });

    it('names the speaker as a performer', () => {
      const ld = buildPresentationJsonLd(delivered, speaker);
      expect(ld.subjectOf![0]!.performer).toEqual([
        { '@type': 'Person', name: 'Guido X Jansen', url: 'https://sifa.id/p/gui.do' },
      ]);
    });

    it('excludes hidden deliveries', () => {
      const ld = buildPresentationJsonLd(
        { ...delivered, deliveries: [{ ...delivered.deliveries[0]!, hidden: true }] },
        speaker,
      );
      expect(ld.subjectOf).toBeUndefined();
    });

    it('classifies slide and recording links distinctly', () => {
      const ld = buildPresentationJsonLd(
        {
          ...delivered,
          deliveries: [
            {
              ...delivered.deliveries[0]!,
              links: [
                { uri: 'https://slides.example/deck', type: 'id.sifa.defs#linkSlides' },
                { uri: 'https://video.example/talk', type: 'id.sifa.defs#linkRecording' },
              ],
            },
          ],
        },
        speaker,
      );
      const event = ld.subjectOf![0]!;
      expect(event.recordedIn).toEqual({
        '@type': 'VideoObject',
        url: 'https://video.example/talk',
      });
      expect(event.workFeatured).toEqual({
        '@type': 'PresentationDigitalDocument',
        url: 'https://slides.example/deck',
      });
    });
  });

  describe('co-speakers respect the confirmation rule', () => {
    // An unconfirmed claim that somebody co-spoke is a claim, not a fact.
    // Emitting it as a schema.org Person would launder it into structured data,
    // which is exactly what the people-links decision forbids.
    const withCoSpeakers = {
      ...talk,
      deliveries: [
        {
          rkey: 'd1',
          eventName: 'AtmosphereConf 2026',
          coSpeakers: [
            {
              did: 'did:plc:aaa',
              handle: 'confirmed.example',
              displayName: 'Confirmed Person',
              confirmed: true,
            },
            {
              did: 'did:plc:bbb',
              handle: 'unconfirmed.example',
              displayName: 'Unconfirmed Person',
              confirmed: false,
            },
          ],
        },
      ],
    };

    it('includes a confirmed co-speaker as a Person', () => {
      const ld = buildPresentationJsonLd(withCoSpeakers, speaker);
      expect(ld.subjectOf![0]!.performer).toContainEqual({
        '@type': 'Person',
        name: 'Confirmed Person',
        url: 'https://sifa.id/p/confirmed.example',
      });
    });

    it('never emits an unconfirmed co-speaker, not even the handle', () => {
      const ld = buildPresentationJsonLd(withCoSpeakers, speaker);
      const serialized = JSON.stringify(ld);
      expect(serialized).not.toContain('Unconfirmed Person');
      expect(serialized).not.toContain('unconfirmed.example');
    });

    it('treats a missing confirmed flag as unconfirmed', () => {
      const ld = buildPresentationJsonLd(
        {
          ...talk,
          deliveries: [
            { rkey: 'd1', coSpeakers: [{ did: 'did:plc:ccc', handle: 'nope.example' }] },
          ],
        },
        speaker,
      );
      expect(JSON.stringify(ld)).not.toContain('nope.example');
    });
  });
});

describe('buildPublicationJsonLd', () => {
  const pub = {
    rkey: '3lpub',
    title: 'Decentralised identity in practice',
    subtitle: 'A field report',
    publisher: 'Journal of Portable Selves',
    date: '2025-11-02',
    url: 'https://example.org/paper',
    description: 'Abstract text.',
    doi: '10.1234/abcd.5678',
  };

  it('emits a ScholarlyArticle with the core bibliographic fields', () => {
    const ld = buildPublicationJsonLd(pub, speaker);
    expect(ld['@type']).toBe('ScholarlyArticle');
    expect(ld.name).toBe('Decentralised identity in practice');
    expect(ld.alternativeHeadline).toBe('A field report');
    expect(ld.publisher).toEqual({ '@type': 'Organization', name: 'Journal of Portable Selves' });
    expect(ld.datePublished).toBe('2025-11-02');
    expect(ld.abstract).toBe('Abstract text.');
  });

  it('emits the DOI as both a resolvable sameAs and a typed identifier', () => {
    const ld = buildPublicationJsonLd(pub, speaker);
    expect(ld.identifier).toEqual({
      '@type': 'PropertyValue',
      propertyID: 'DOI',
      value: '10.1234/abcd.5678',
    });
    expect(ld.sameAs).toContain('https://doi.org/10.1234/abcd.5678');
  });

  it('omits DOI properties when there is no DOI', () => {
    const ld = buildPublicationJsonLd({ ...pub, doi: undefined }, speaker);
    expect(ld.identifier).toBeUndefined();
    expect(ld.sameAs).toBeUndefined();
  });

  it('normalises a DOI that already carries a resolver prefix', () => {
    const ld = buildPublicationJsonLd(
      { ...pub, doi: 'https://doi.org/10.1234/abcd.5678' },
      speaker,
    );
    expect(ld.identifier?.value).toBe('10.1234/abcd.5678');
    expect(ld.sameAs).toEqual(['https://doi.org/10.1234/abcd.5678']);
  });

  it('preserves contributor order', () => {
    const ld = buildPublicationJsonLd(
      {
        ...pub,
        contributors: [
          { name: 'First Author' },
          { name: 'Second Author' },
          { name: 'Third Author' },
        ],
      },
      speaker,
    );
    expect(ld.author?.map((a) => a.name)).toEqual([
      'First Author',
      'Second Author',
      'Third Author',
    ]);
  });

  it('falls back to the profile owner when no contributors are recorded', () => {
    const ld = buildPublicationJsonLd(pub, speaker);
    expect(ld.author).toEqual([
      { '@type': 'Person', name: 'Guido X Jansen', url: 'https://sifa.id/p/gui.do' },
    ]);
  });

  it('links a contributor ORCID as sameAs', () => {
    const ld = buildPublicationJsonLd(
      { ...pub, contributors: [{ name: 'Orcid Person', orcidId: '0000-0002-1825-0097' }] },
      speaker,
    );
    expect(ld.author?.[0]?.sameAs).toContain('https://orcid.org/0000-0002-1825-0097');
  });
});

describe('buildCourseJsonLd', () => {
  it('emits a Course with its provider and code', () => {
    const ld = buildCourseJsonLd({
      rkey: 'c1',
      name: 'Distributed Systems',
      number: 'CS-4410',
      institution: 'Example University',
    });
    expect(ld['@type']).toBe('Course');
    expect(ld.name).toBe('Distributed Systems');
    expect(ld.courseCode).toBe('CS-4410');
    expect(ld.provider).toEqual({ '@type': 'EducationalOrganization', name: 'Example University' });
  });

  it('omits provider and courseCode when absent', () => {
    const ld = buildCourseJsonLd({ rkey: 'c2', name: 'Solo Course' });
    expect(ld.provider).toBeUndefined();
    expect(ld.courseCode).toBeUndefined();
  });
});

describe('buildProjectJsonLd', () => {
  it('emits a Project with its dates and url', () => {
    const ld = buildProjectJsonLd(
      {
        rkey: 'p1',
        name: 'Sifa',
        description: 'Portable professional identity.',
        url: 'https://sifa.id',
        startDate: '2026-03',
      },
      speaker,
    );
    expect(ld['@type']).toBe('Project');
    expect(ld.name).toBe('Sifa');
    expect(ld.url).toBe('https://sifa.id');
    expect(ld.startDate).toBe('2026-03');
  });

  it('applies the same confirmation rule to project members', () => {
    const ld = buildProjectJsonLd(
      {
        rkey: 'p1',
        name: 'Sifa',
        members: [
          { did: 'did:plc:aaa', handle: 'yes.example', displayName: 'Yes Person', confirmed: true },
          { did: 'did:plc:bbb', handle: 'no.example', displayName: 'No Person', confirmed: false },
        ],
      },
      speaker,
    );
    const serialized = JSON.stringify(ld);
    expect(serialized).toContain('Yes Person');
    expect(serialized).not.toContain('No Person');
    expect(serialized).not.toContain('no.example');
  });
});
