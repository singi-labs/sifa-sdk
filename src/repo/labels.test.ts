import { describe, expect, it } from 'vitest';

import { describeSifaRecord } from './labels.js';

describe('describeSifaRecord', () => {
  it('reads a position as its job title and employer', () => {
    expect(
      describeSifaRecord('id.sifa.profile.position', {
        title: 'Senior Engineer',
        company: 'Acme',
        startedAt: '2021-03',
        endedAt: '2024-01',
        createdAt: '2026-01-01T00:00:00.000Z',
      }),
    ).toEqual({ primary: 'Senior Engineer', secondary: 'Acme', date: '2021-03' });
  });

  it('reads education as the degree and institution', () => {
    expect(
      describeSifaRecord('id.sifa.profile.education', {
        institution: 'TU Delft',
        degree: 'MSc',
        fieldOfStudy: 'Computer Science',
        startedAt: '2012',
        createdAt: '2026-01-01T00:00:00.000Z',
      }),
    ).toEqual({ primary: 'MSc', secondary: 'TU Delft', date: '2012' });
  });

  it('falls back to the field of study when a degree is not recorded', () => {
    expect(
      describeSifaRecord('id.sifa.profile.education', {
        institution: 'TU Delft',
        fieldOfStudy: 'Computer Science',
        createdAt: '2026-01-01T00:00:00.000Z',
      }),
    ).toEqual({ primary: 'Computer Science', secondary: 'TU Delft' });
  });

  it('reads a skill as its name', () => {
    expect(
      describeSifaRecord('id.sifa.profile.skill', {
        name: 'TypeScript',
        createdAt: '2026-01-01T00:00:00.000Z',
      }),
    ).toEqual({ primary: 'TypeScript' });
  });

  it('carries the subject DID of an endorsement separately from the label text', () => {
    expect(
      describeSifaRecord('id.sifa.endorsement', {
        subject: 'did:plc:abc123',
        skill: 'at://did:plc:self/id.sifa.profile.skill/xyz',
        skillName: 'TypeScript',
        createdAt: '2026-01-01T00:00:00.000Z',
      }),
    ).toEqual({ primary: 'TypeScript', subjectDid: 'did:plc:abc123' });
  });

  it('carries the subject DID of a follow, which has no text of its own', () => {
    expect(
      describeSifaRecord('id.sifa.graph.follow', {
        subject: 'did:plc:abc123',
        createdAt: '2026-01-01T00:00:00.000Z',
      }),
    ).toEqual({ primary: 'follow', subjectDid: 'did:plc:abc123' });
  });

  it('reads a presentation delivery as the talk title and event', () => {
    expect(
      describeSifaRecord('id.sifa.profile.presentationDelivery', {
        title: 'Shipping on ATProto',
        eventName: 'AtmosphereConf',
        date: '2026-03-04',
        createdAt: '2026-01-01T00:00:00.000Z',
      }),
    ).toEqual({ primary: 'Shipping on ATProto', secondary: 'AtmosphereConf', date: '2026-03-04' });
  });

  // The city lives under `address`, not at the top level. A rule that could
  // only see the top level rendered the bare word "location" -- the one item
  // on the page about where someone physically is, showing them nothing.
  it('reads a location from its nested address', () => {
    expect(
      describeSifaRecord('id.sifa.profile.location', {
        type: 'id.sifa.defs#locationPrimary',
        address: {
          $type: 'community.lexicon.location.address',
          locality: 'Amsterdam',
          region: 'North Holland',
          country: 'NL',
        },
        isPrimary: true,
        createdAt: '2026-04-13T19:26:34.283Z',
      }),
    ).toEqual({ primary: 'Amsterdam', secondary: 'NL' });
  });

  it('falls back through the nested address when the city is missing', () => {
    expect(
      describeSifaRecord('id.sifa.profile.location', {
        address: { region: 'North Holland', country: 'NL' },
      }),
    ).toEqual({ primary: 'North Holland', secondary: 'NL' });
  });

  it('does not throw when a dotted path runs through a non-object', () => {
    expect(describeSifaRecord('id.sifa.profile.location', { address: 'Amsterdam' })).toEqual({
      primary: 'location',
    });
  });

  it('falls back to the collection leaf when the record has no usable text', () => {
    expect(describeSifaRecord('id.sifa.authProfileAccess', { createdAt: '2026-01-01' })).toEqual({
      primary: 'authProfileAccess',
    });
  });

  it('does not throw on a record that does not match its schema', () => {
    expect(() => describeSifaRecord('id.sifa.profile.position', null)).not.toThrow();
    expect(describeSifaRecord('id.sifa.profile.position', null)).toEqual({ primary: 'position' });
    expect(describeSifaRecord('id.sifa.profile.position', 'not an object')).toEqual({
      primary: 'position',
    });
    expect(describeSifaRecord('id.sifa.profile.position', { title: 42 })).toEqual({
      primary: 'position',
    });
  });

  it('ignores blank and whitespace-only strings rather than rendering an empty label', () => {
    expect(
      describeSifaRecord('id.sifa.profile.skill', { name: '   ', createdAt: '2026-01-01' }),
    ).toEqual({ primary: 'skill' });
  });

  it('trims surrounding whitespace from user text', () => {
    expect(describeSifaRecord('id.sifa.profile.skill', { name: '  Rust  ' })).toEqual({
      primary: 'Rust',
    });
  });

  it('handles an unknown collection without a rule', () => {
    expect(describeSifaRecord('id.sifa.profile.somethingNew', { title: 'Whatever' })).toEqual({
      primary: 'somethingNew',
    });
  });
});
