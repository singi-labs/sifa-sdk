import { describe, expect, it } from 'vitest';

import {
  streamCardBodyContent,
  streamCardContent,
  streamCardSubjectText,
} from './stream-card-content.js';
import type { StreamCardVM } from './stream-card-vm.js';

function vm(partial: Partial<StreamCardVM>): StreamCardVM {
  return {
    uri: 'at://did:plc:x/app/1',
    cid: 'bafy',
    verb: 'published',
    source: { appId: 'standard', label: 'Standard', color: 'gray' },
    tier: 'creation',
    timestamp: '2026-01-01T00:00:00.000Z',
    title: 'Published',
    ...partial,
  };
}

describe('streamCardBodyContent', () => {
  it('returns null for no body', () => {
    expect(streamCardBodyContent(undefined)).toBeNull();
  });

  it('prefers text, then title, then venueName, then communityName', () => {
    expect(streamCardBodyContent({ kind: 'text', text: 'hello' })).toBe('hello');
    expect(streamCardBodyContent({ kind: 'standard-site', title: 'My Article' })).toBe(
      'My Article',
    );
    expect(streamCardBodyContent({ kind: 'location', venueName: 'The Cafe' })).toBe('The Cafe');
    expect(streamCardBodyContent({ kind: 'membership', communityName: 'Barazo' })).toBe('Barazo');
  });

  it('trims and returns null for whitespace-only', () => {
    expect(streamCardBodyContent({ kind: 'text', text: '  spaced  ' })).toBe('spaced');
    expect(streamCardBodyContent({ kind: 'text', text: '   ' })).toBeNull();
  });
});

describe('streamCardSubjectText', () => {
  it('reads a record title, a person name, or a nested post body', () => {
    expect(streamCardSubjectText({ kind: 'record', uri: 'x', title: 'A Page' })).toBe('A Page');
    expect(
      streamCardSubjectText({ kind: 'person', did: 'd', displayName: 'Ada', handle: 'ada.dev' }),
    ).toBe('Ada');
    expect(streamCardSubjectText({ kind: 'person', did: 'd', handle: 'ada.dev' })).toBe('ada.dev');
    const post = vm({ body: { kind: 'text', text: 'quoted note' } });
    expect(streamCardSubjectText({ kind: 'post', post })).toBe('quoted note');
  });
});

describe('streamCardContent', () => {
  it('reads the article title from the body when there is no subject', () => {
    const card = vm({
      body: { kind: 'standard-site', title: 'My Article' },
      sourceUrl: 'https://example.com/a',
    });
    expect(streamCardContent(card)).toEqual({ text: 'My Article', url: 'https://example.com/a' });
  });

  it('reads the venue for a location check-in', () => {
    const card = vm({
      verb: 'wasAt',
      title: 'Was at',
      body: { kind: 'location', venueName: 'The Cafe' },
    });
    expect(streamCardContent(card)).toEqual({ text: 'The Cafe', url: null });
  });

  it('prefers the subject (an annotated page) over the body, with the subject url', () => {
    const card = vm({
      verb: 'annotated',
      title: 'Annotated',
      subject: { kind: 'record', uri: 'x', title: 'Annotated Page', url: 'https://page.example' },
      sourceUrl: 'https://ignored.example',
    });
    expect(streamCardContent(card)).toEqual({
      text: 'Annotated Page',
      url: 'https://page.example',
    });
  });

  it('returns null text when the card is verb-only', () => {
    expect(streamCardContent(vm({}))).toEqual({ text: null, url: null });
  });
});
