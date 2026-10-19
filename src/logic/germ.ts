import type { GermDeclarationRecord } from '../schemas/germ-declaration.js';

/**
 * Hosts a `messageMeUrl` may point at. Germ's own landing host only: a
 * declaration is user-written, so any other host would let someone put a
 * "Message on Germ" button in front of an arbitrary site. Update this list
 * when Germ moves domains.
 */
export const GERM_MESSAGE_HOSTS: readonly string[] = ['landing.ger.mx'];

/** Platform hint Germ's landing page understands, as a path segment. */
export type GermPlatform = 'iOS' | 'android' | 'web';

/** The two `showButtonTo` values that can produce a button. */
export type GermButtonAudience = 'everyone' | 'usersIFollow';

const MAX_DID_LENGTH = 2048;
// Stricter than `didSchema`: the value goes unescaped into the link fragment,
// where Germ splits on `+` after decoding. Percent-encoding is allowed only as
// `%3A` (the did:web port colon), so `%2B` cannot smuggle in a second `+`.
const STRICT_DID = /^did:[a-z]+:(?:[A-Za-z0-9._:-]|%3A)*(?:[A-Za-z0-9._-]|%3A)$/;

/**
 * Strict DID syntax check for values that end up in a Germ link fragment.
 * Rejects `+`, `#`, `/`, `?`, whitespace and percent-encoding other than `%3A`, so a crafted DID cannot add a
 * second `+` segment or break out of the fragment.
 */
export function isStrictDid(value: string): boolean {
  return value.length <= MAX_DID_LENGTH && STRICT_DID.test(value);
}

/**
 * Parse a `messageMeUrl` and accept it only when it is a plain `https:` URL on
 * a {@link GERM_MESSAGE_HOSTS} host, without credentials, port, trailing-dot
 * host or fragment. A bare trailing `#` counts as an empty fragment.
 */
function parseGermMessageUrl(raw: string): URL | null {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return null;
  }
  if (url.protocol !== 'https:') return null;
  if (url.username !== '' || url.password !== '' || url.port !== '') return null;
  if (!GERM_MESSAGE_HOSTS.includes(url.hostname)) return null;
  if (url.hash !== '') return null;
  return url;
}

/**
 * Who a declaration lets see the button, or `null` for nobody: no record, an
 * empty key (the DID is no longer bound to Germ), no `messageMe`, `none`, an
 * unknown value, or a `messageMeUrl` that is not a Germ URL.
 */
export function germButtonAudience(
  declaration: GermDeclarationRecord | null,
): GermButtonAudience | null {
  if (!declaration) return null;
  const key = declaration.currentKey;
  if (key instanceof Uint8Array ? key.length === 0 : key.$bytes === '') return null;
  const messageMe = declaration.messageMe;
  if (!messageMe) return null;
  if (!parseGermMessageUrl(messageMe.messageMeUrl)) return null;
  if (messageMe.showButtonTo === 'everyone' || messageMe.showButtonTo === 'usersIFollow') {
    return messageMe.showButtonTo;
  }
  return null;
}

export interface ShouldShowGermButtonInput {
  audience: GermButtonAudience | null;
  ownerDid: string;
  /** `null` for a logged-out viewer. */
  viewerDid: string | null;
  /** Whether the profile owner follows the viewer on Bluesky; `null` when unknown. */
  ownerFollowsViewer: boolean | null;
}

/**
 * Germ's rule for rendering the button on the owner's profile: `everyone`
 * shows it to any viewer, `usersIFollow` only to a logged-in viewer the owner
 * follows. Never on your own profile. An unknown follow state hides it.
 */
export function shouldShowGermButton(input: ShouldShowGermButtonInput): boolean {
  const { audience, ownerDid, viewerDid, ownerFollowsViewer } = input;
  if (!audience) return false;
  if (!isStrictDid(ownerDid)) return false;
  if (viewerDid !== null && !isStrictDid(viewerDid)) return false;
  if (viewerDid === ownerDid) return false;
  if (audience === 'everyone') return true;
  return viewerDid !== null && ownerFollowsViewer === true;
}

export interface BuildGermMessageUrlInput {
  messageMeUrl: string;
  ownerDid: string;
  /** `null` for a logged-out viewer: the fragment then holds only the owner. */
  viewerDid: string | null;
  platform?: GermPlatform;
}

/**
 * Build the link the button opens: the owner's `messageMeUrl`, an optional
 * platform path segment, and the fragment `<ownerDid>+<viewerDid>` (or
 * `<ownerDid>` when logged out). Returns `null` when the URL or a DID fails
 * validation.
 */
export function buildGermMessageUrl(input: BuildGermMessageUrlInput): string | null {
  const { messageMeUrl, ownerDid, viewerDid, platform } = input;
  if (!isStrictDid(ownerDid)) return null;
  if (viewerDid !== null && !isStrictDid(viewerDid)) return null;
  const url = parseGermMessageUrl(messageMeUrl);
  if (!url) return null;
  if (platform) {
    url.pathname = `${url.pathname.replace(/\/+$/, '')}/${platform}`;
  }
  url.hash = viewerDid ? `${ownerDid}+${viewerDid}` : ownerDid;
  return url.toString();
}

/**
 * Map a request's User-Agent to Germ's platform hint. iPhone and iPad report
 * `iOS`; an iPad in desktop mode reports as a Mac and maps to `web`, like
 * every other desktop.
 */
export function germPlatformFromUserAgent(userAgent: string | null | undefined): GermPlatform {
  if (!userAgent) return 'web';
  if (/\b(iPhone|iPad|iPod)\b/.test(userAgent)) return 'iOS';
  if (/\bAndroid\b/i.test(userAgent)) return 'android';
  return 'web';
}
