import { describe, expect, it } from 'vitest';

import {
  GERM_MESSAGE_HOSTS,
  buildGermMessageUrl,
  germButtonAudience,
  germPlatformFromUserAgent,
  isStrictDid,
  shouldShowGermButton,
} from './germ.js';
import type { GermDeclarationRecord } from '../schemas/germ-declaration.js';

const OWNER = 'did:plc:lbu36k4mysk5g6gcrpw4dbwm';
const VIEWER = 'did:plc:ad4m72ykh2evfdqen3qowxmg';
const LANDING = 'https://landing.ger.mx/newUser';

function declaration(overrides: Partial<GermDeclarationRecord> = {}): GermDeclarationRecord {
  return {
    version: '1.1.0',
    currentKey: { $bytes: 'AQIDBA' },
    messageMe: { showButtonTo: 'everyone', messageMeUrl: LANDING },
    ...overrides,
  };
}

describe('GERM_MESSAGE_HOSTS', () => {
  it('contains the Germ landing host', () => {
    expect(GERM_MESSAGE_HOSTS).toContain('landing.ger.mx');
  });
});

describe('isStrictDid', () => {
  it.each([OWNER, 'did:web:example.com', 'did:web:localhost%3A8080'])('accepts %s', (did) => {
    expect(isStrictDid(did)).toBe(true);
  });

  it.each([
    '',
    'plc:abc',
    'did:PLC:abc',
    'did:plc:',
    'did:plc:abc:',
    'did:plc:abc+did:plc:def',
    'did:plc:abc#frag',
    'did:plc:abc/path',
    'did:plc:abc?q',
    'did:plc:a b',
    'did:web:a%2Bb',
    'did:web:a%',
    `did:plc:${'a'.repeat(2048)}`,
  ])('rejects %j', (did) => {
    expect(isStrictDid(did)).toBe(false);
  });
});

describe('germButtonAudience', () => {
  it('is null without a declaration', () => {
    expect(germButtonAudience(null)).toBeNull();
  });

  it('is null when the key is empty (DID no longer bound to Germ)', () => {
    expect(germButtonAudience(declaration({ currentKey: { $bytes: '' } }))).toBeNull();
  });

  it('is null when a decoded key is empty', () => {
    expect(germButtonAudience(declaration({ currentKey: new Uint8Array(0) }))).toBeNull();
    expect(germButtonAudience(declaration({ currentKey: new Uint8Array([1]) }))).toBe('everyone');
  });

  it('is null without messageMe', () => {
    expect(germButtonAudience(declaration({ messageMe: undefined }))).toBeNull();
  });

  it.each(['none', 'friends', ''])('is null for showButtonTo %j', (value) => {
    expect(
      germButtonAudience(
        declaration({ messageMe: { showButtonTo: value, messageMeUrl: LANDING } }),
      ),
    ).toBeNull();
  });

  it.each(['everyone', 'usersIFollow'] as const)('passes %s through', (value) => {
    expect(
      germButtonAudience(
        declaration({ messageMe: { showButtonTo: value, messageMeUrl: LANDING } }),
      ),
    ).toBe(value);
  });

  it('is null when messageMeUrl is not a Germ URL', () => {
    expect(
      germButtonAudience(
        declaration({
          messageMe: { showButtonTo: 'everyone', messageMeUrl: 'https://example.com/newUser' },
        }),
      ),
    ).toBeNull();
  });
});

describe('shouldShowGermButton', () => {
  const base = { ownerDid: OWNER, viewerDid: VIEWER, ownerFollowsViewer: false };

  it('hides without an audience', () => {
    expect(shouldShowGermButton({ ...base, audience: null })).toBe(false);
  });

  it('shows to everyone, logged in or out', () => {
    expect(shouldShowGermButton({ ...base, audience: 'everyone' })).toBe(true);
    expect(shouldShowGermButton({ ...base, audience: 'everyone', viewerDid: null })).toBe(true);
  });

  it('shows usersIFollow only when the owner follows the viewer', () => {
    expect(
      shouldShowGermButton({ ...base, audience: 'usersIFollow', ownerFollowsViewer: true }),
    ).toBe(true);
    expect(
      shouldShowGermButton({ ...base, audience: 'usersIFollow', ownerFollowsViewer: false }),
    ).toBe(false);
    expect(
      shouldShowGermButton({ ...base, audience: 'usersIFollow', ownerFollowsViewer: null }),
    ).toBe(false);
  });

  it('hides usersIFollow from logged-out viewers', () => {
    expect(
      shouldShowGermButton({
        ...base,
        audience: 'usersIFollow',
        viewerDid: null,
        ownerFollowsViewer: true,
      }),
    ).toBe(false);
  });

  it('hides on your own profile', () => {
    expect(shouldShowGermButton({ ...base, audience: 'everyone', viewerDid: OWNER })).toBe(false);
  });

  it('hides when a DID is malformed', () => {
    expect(shouldShowGermButton({ ...base, audience: 'everyone', ownerDid: 'did:plc:a+b' })).toBe(
      false,
    );
    expect(shouldShowGermButton({ ...base, audience: 'everyone', viewerDid: 'did:plc:a#b' })).toBe(
      false,
    );
  });
});

describe('buildGermMessageUrl', () => {
  const build = (
    messageMeUrl: string,
    extra: Partial<Parameters<typeof buildGermMessageUrl>[0]> = {},
  ) => buildGermMessageUrl({ messageMeUrl, ownerDid: OWNER, viewerDid: VIEWER, ...extra });

  it('appends owner+viewer as the fragment', () => {
    expect(build(LANDING)).toBe(`${LANDING}#${OWNER}+${VIEWER}`);
  });

  it('uses only the owner DID for a logged-out viewer', () => {
    expect(build(LANDING, { viewerDid: null })).toBe(`${LANDING}#${OWNER}`);
  });

  it('adds the platform hint as a path segment before the fragment', () => {
    expect(build(LANDING, { platform: 'iOS' })).toBe(
      `https://landing.ger.mx/newUser/iOS#${OWNER}+${VIEWER}`,
    );
    expect(build(`${LANDING}/`, { platform: 'android' })).toBe(
      `https://landing.ger.mx/newUser/android#${OWNER}+${VIEWER}`,
    );
  });

  it('keeps a query string', () => {
    expect(build(`${LANDING}?ref=x`, { platform: 'web' })).toBe(
      `https://landing.ger.mx/newUser/web?ref=x#${OWNER}+${VIEWER}`,
    );
  });

  it('accepts a bare trailing # as an empty fragment', () => {
    expect(build(`${LANDING}#`)).toBe(`${LANDING}#${OWNER}+${VIEWER}`);
  });

  it('normalizes an uppercase host', () => {
    expect(build('https://LANDING.GER.MX/newUser')).toBe(`${LANDING}#${OWNER}+${VIEWER}`);
  });

  it.each([
    'http://landing.ger.mx/newUser',
    'https://landing.ger.mx./newUser',
    'https://landing.ger.mx:8443/newUser',
    'https://user:pass@landing.ger.mx/newUser',
    'https://evil.landing.ger.mx/newUser',
    'https://landing.ger.mx.evil.com/newUser',
    'https://example.com/newUser',
    `${LANDING}#already`,
    'javascript:alert(1)',
    'not a url',
  ])('rejects %s', (url) => {
    expect(build(url)).toBeNull();
  });

  it('rejects malformed DIDs', () => {
    expect(build(LANDING, { ownerDid: 'did:plc:a+b' })).toBeNull();
    expect(build(LANDING, { viewerDid: 'did:plc:a#b' })).toBeNull();
  });
});

describe('germPlatformFromUserAgent', () => {
  it.each([
    [
      'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1',
      'iOS',
    ],
    [
      'Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
      'iOS',
    ],
    [
      'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Mobile Safari/537.36',
      'android',
    ],
    [
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Safari/605.1.15',
      'web',
    ],
    ['Mozilla/5.0 (X11; Linux x86_64; rv:131.0) Gecko/20100101 Firefox/131.0', 'web'],
    ['', 'web'],
    [null, 'web'],
  ] as const)('maps %j to %s', (ua, platform) => {
    expect(germPlatformFromUserAgent(ua)).toBe(platform);
  });
});
