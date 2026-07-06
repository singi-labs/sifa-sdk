import { describe, expect, it } from 'vitest';
import {
  parsePresentationDuration,
  durationFromMinutes,
  parseIntendedAudiences,
  stripHtmlToText,
  normalizePresentationRole,
  normalizePresentationMode,
  presentationCsvRowToRecord,
  presentationDeliveryCsvRowToRecord,
} from './presentation-csv.js';
import {
  ProfilePresentationRecordSchema,
  ProfilePresentationDeliveryRecordSchema,
} from '../schemas/index.js';

const NOW = '2026-05-15T10:00:00.000Z';

describe('parsePresentationDuration', () => {
  it('parses a single value', () => {
    expect(parsePresentationDuration('30 min')).toEqual({ minMinutes: 30 });
    expect(parsePresentationDuration('30 minutes')).toEqual({ minMinutes: 30 });
    expect(parsePresentationDuration('45')).toEqual({ minMinutes: 45 });
  });
  it('parses a range', () => {
    expect(parsePresentationDuration('20-30 minutes')).toEqual({ minMinutes: 20, maxMinutes: 30 });
    expect(parsePresentationDuration('20 to 30 min')).toEqual({ minMinutes: 20, maxMinutes: 30 });
  });
  it('ignores a second number lower than the first', () => {
    expect(parsePresentationDuration('60-30')).toEqual({ minMinutes: 60 });
  });
  it('returns undefined for no usable number', () => {
    expect(parsePresentationDuration('')).toBeUndefined();
    expect(parsePresentationDuration('a while')).toBeUndefined();
    expect(parsePresentationDuration('0')).toBeUndefined();
  });
});

describe('durationFromMinutes', () => {
  it('builds from explicit columns', () => {
    expect(durationFromMinutes('20', '30')).toEqual({ minMinutes: 20, maxMinutes: 30 });
    expect(durationFromMinutes('30', '')).toEqual({ minMinutes: 30 });
    expect(durationFromMinutes('', '')).toBeUndefined();
  });
});

describe('parseIntendedAudiences', () => {
  it('splits and trims, dropping empties', () => {
    expect(parseIntendedAudiences('Engineers; Leaders ; ')).toEqual(['Engineers', 'Leaders']);
    expect(parseIntendedAudiences('')).toEqual([]);
  });
});

describe('stripHtmlToText', () => {
  it('strips tags and decodes entities', () => {
    expect(stripHtmlToText('<p>Build &amp; ship</p>')).toBe('Build & ship');
    expect(stripHtmlToText('<p>a</p><p>b</p>')).toBe('a\nb');
  });
});

describe('normalizePresentationRole', () => {
  it('maps friendly values and existing tokens to tokens', () => {
    expect(normalizePresentationRole('presenter')).toBe('id.sifa.defs#presenter');
    expect(normalizePresentationRole('speaker')).toBe('id.sifa.defs#presenter');
    expect(normalizePresentationRole('Keynote')).toBe('id.sifa.defs#keynote');
    expect(normalizePresentationRole('id.sifa.defs#host')).toBe('id.sifa.defs#host');
    expect(normalizePresentationRole('')).toBeUndefined();
  });

  it('maps free-text and compound roles to the nearest token by keyword', () => {
    expect(normalizePresentationRole('Event host/moderator')).toBe('id.sifa.defs#host');
    expect(normalizePresentationRole('Organizer & co-host/moderator')).toBe('id.sifa.defs#host');
    expect(normalizePresentationRole('Podcast livestream host')).toBe('id.sifa.defs#host');
    expect(normalizePresentationRole('emcee')).toBe('id.sifa.defs#host');
    expect(normalizePresentationRole('Panellist')).toBe('id.sifa.defs#panelist');
    expect(normalizePresentationRole('Workshop facilitator')).toBe('id.sifa.defs#workshop');
  });

  it('drops an organizer-only or otherwise unrecognized role rather than storing it raw', () => {
    expect(normalizePresentationRole('main event organizer')).toBeUndefined();
    expect(normalizePresentationRole('attendee')).toBeUndefined();
  });
});

describe('normalizePresentationMode', () => {
  it('maps friendly values to community tokens and drops unknowns', () => {
    expect(normalizePresentationMode('in person')).toBe(
      'community.lexicon.calendar.event#inperson',
    );
    expect(normalizePresentationMode('Virtual')).toBe('community.lexicon.calendar.event#virtual');
    expect(normalizePresentationMode('community.lexicon.calendar.event#hybrid')).toBe(
      'community.lexicon.calendar.event#hybrid',
    );
    expect(normalizePresentationMode('weird')).toBeUndefined();
  });
});

describe('presentationCsvRowToRecord', () => {
  it('maps a gui.do-shaped row and the result validates against the schema', () => {
    const { key, record } = presentationCsvRowToRecord({
      presentation_key: 'grow-smart',
      title: 'Grow Smart or Die Fast',
      description: '<p>Build for the customer journeys of tomorrow.</p>',
      duration: '30 min',
      intended_audiences: 'E-commerce managers; Marketeers',
      slides_url: 'https://slideshare.net/gxjansen/grow-smart',
      recording_url: '',
    });
    expect(key).toBe('grow-smart');
    expect(record.title).toBe('Grow Smart or Die Fast');
    expect(record.description).toBe('Build for the customer journeys of tomorrow.');
    expect(record.duration).toEqual({ minMinutes: 30 });
    expect(record.intendedAudiences).toEqual(['E-commerce managers', 'Marketeers']);
    expect(record.links).toEqual([
      { uri: 'https://slideshare.net/gxjansen/grow-smart', type: 'id.sifa.defs#linkSlides' },
    ]);
    expect(ProfilePresentationRecordSchema.safeParse({ ...record, createdAt: NOW }).success).toBe(
      true,
    );
  });
});

describe('presentationDeliveryCsvRowToRecord', () => {
  it('maps a delivery row with friendly role/mode and validates against the schema', () => {
    const { presentationKey, record } = presentationDeliveryCsvRowToRecord({
      presentation_key: 'grow-smart',
      event_name: 'DevConf',
      date: '2025-09-12',
      location: 'Berlin, DE',
      role: 'keynote',
      mode: 'virtual',
      event_url: 'https://devconf.example',
    });
    expect(presentationKey).toBe('grow-smart');
    expect(record).toMatchObject({
      eventName: 'DevConf',
      date: '2025-09-12',
      location: 'Berlin, DE',
      role: 'id.sifa.defs#keynote',
      mode: 'community.lexicon.calendar.event#virtual',
    });
    expect(record.links).toEqual([
      { uri: 'https://devconf.example', type: 'id.sifa.defs#linkEvent' },
    ]);
    expect(
      ProfilePresentationDeliveryRecordSchema.safeParse({ ...record, createdAt: NOW }).success,
    ).toBe(true);
  });
});
