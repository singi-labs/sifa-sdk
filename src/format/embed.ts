/**
 * Resolve a slide / video URL to an embed descriptor. Pure and offline.
 *
 * Three outcomes:
 * - `iframe`: the URL carries everything an embed needs, so the iframe `src` is
 *   known offline (YouTube, Vimeo, Google Slides, Loom, Canva).
 * - `oembed`: the URL is a known embeddable provider whose iframe `src` is NOT
 *   in the URL and needs a server-side oEmbed lookup (SlideShare, SpeakerDeck
 *   public deck URLs). The caller resolves the src via its own oEmbed step.
 * - `link`: not embeddable; render a plain link.
 */

/**
 * A resolved embed: an iframe whose src is known offline, an `oembed` provider
 * whose src needs a server lookup (carries the original page URL), or a plain
 * link.
 */
export type EmbedResult =
  | { kind: 'iframe'; provider: string; src: string; aspectRatio: '16:9' | '4:3' }
  | { kind: 'oembed'; provider: string; aspectRatio: '16:9' | '4:3'; pageUrl: string }
  | { kind: 'link' };

const LINK: EmbedResult = { kind: 'link' };

/** YouTube video IDs: 11 chars in practice, but accept the documented charset. */
const YOUTUBE_ID = /^[A-Za-z0-9_-]{6,}$/;

/**
 * Extract a YouTube video id from any recognized YouTube URL (`youtu.be/ID`,
 * `youtube.com/watch?v=ID`, `/embed/ID`, `/shorts/ID`), or null. Pure/offline.
 */
export function youtubeVideoId(url: string): string | null {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return null;
  }
  if (parsed.protocol !== 'https:') return null;
  const host = bareHost(parsed.hostname);
  const segments = parsed.pathname.split('/').filter(Boolean);
  let id: string | null = null;
  if (host === 'youtu.be') id = segments[0] ?? null;
  else if (host === 'youtube.com' || host === 'm.youtube.com') {
    if (parsed.pathname === '/watch') id = parsed.searchParams.get('v');
    else if (segments[0] === 'embed' || segments[0] === 'shorts') id = segments[1] ?? null;
  }
  return id && YOUTUBE_ID.test(id) ? id : null;
}

/**
 * The public thumbnail URL for a YouTube video id (`i.ytimg.com`). Derivable
 * offline. NOTE: this host is Google — never load it directly in a privacy
 * context; fetch and re-serve it from your own origin.
 */
export function youtubeThumbnailUrl(videoId: string): string {
  return `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
}

/** Strip a leading `www.` so host matching is scheme/subdomain tolerant. */
function bareHost(hostname: string): string {
  return hostname.toLowerCase().replace(/^www\./, '');
}

/**
 * Recognize an embeddable URL and return its iframe descriptor, else a link.
 * Only https URLs are accepted.
 */
export function resolveEmbed(url: string): EmbedResult {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return LINK;
  }
  if (parsed.protocol !== 'https:') return LINK;

  const host = bareHost(parsed.hostname);
  const segments = parsed.pathname.split('/').filter(Boolean);

  // --- YouTube -> privacy-enhanced nocookie embed ---
  if (host === 'youtu.be' || host === 'youtube.com' || host === 'm.youtube.com') {
    const id = youtubeVideoId(url);
    return id ? youtubeEmbed(id) : LINK;
  }

  // --- Vimeo ---
  if (host === 'vimeo.com') {
    const id = segments[0];
    if (id && /^\d+$/.test(id)) {
      return {
        kind: 'iframe',
        provider: 'vimeo',
        src: `https://player.vimeo.com/video/${id}`,
        aspectRatio: '16:9',
      };
    }
    return LINK;
  }
  if (host === 'player.vimeo.com') {
    if (segments[0] === 'video' && segments[1] && /^\d+$/.test(segments[1])) {
      return {
        kind: 'iframe',
        provider: 'vimeo',
        src: `https://player.vimeo.com/video/${segments[1]}`,
        aspectRatio: '16:9',
      };
    }
    return LINK;
  }

  // --- SpeakerDeck ---
  // An already-resolved `speakerdeck.com/player/HEXID` embed URL is embeddable
  // offline. A public `speakerdeck.com/USER/SLUG` deck URL needs a server oEmbed
  // lookup for the data-id, so it is `oembed`, not a dead link.
  if (host === 'speakerdeck.com') {
    if (segments[0] === 'player' && segments[1]) {
      return { kind: 'iframe', provider: 'speakerdeck', src: parsed.href, aspectRatio: '4:3' };
    }
    if (segments.length >= 2) {
      return { kind: 'oembed', provider: 'speakerdeck', aspectRatio: '4:3', pageUrl: parsed.href };
    }
    return LINK;
  }

  // --- SlideShare ---
  // An already-resolved `slideshow/embed_code/...` URL is embeddable offline. A
  // public deck URL needs a server oEmbed lookup for the embed_code id, so it is
  // `oembed`.
  if (host === 'slideshare.net') {
    if (segments[0] === 'slideshow' && segments[1] === 'embed_code') {
      return { kind: 'iframe', provider: 'slideshare', src: parsed.href, aspectRatio: '4:3' };
    }
    if (segments.length >= 2) {
      return { kind: 'oembed', provider: 'slideshare', aspectRatio: '4:3', pageUrl: parsed.href };
    }
    return LINK;
  }

  // --- Google Slides ---
  if (host === 'docs.google.com') {
    if (segments[0] === 'presentation' && segments[1] === 'd' && segments[2]) {
      return {
        kind: 'iframe',
        provider: 'googleslides',
        src: `https://docs.google.com/presentation/d/${segments[2]}/embed`,
        aspectRatio: '16:9',
      };
    }
    return LINK;
  }

  // --- Loom ---
  if (host === 'loom.com') {
    if (segments[0] === 'share' && segments[1]) {
      return {
        kind: 'iframe',
        provider: 'loom',
        src: `https://www.loom.com/embed/${segments[1]}`,
        aspectRatio: '16:9',
      };
    }
    return LINK;
  }

  // --- Canva ---
  if (host === 'canva.com') {
    if (segments[0] === 'design' && segments[1] && segments[2] === 'view') {
      return {
        kind: 'iframe',
        provider: 'canva',
        src: `https://www.canva.com/design/${segments[1]}/view?embed`,
        aspectRatio: '16:9',
      };
    }
    return LINK;
  }

  return LINK;
}

function youtubeEmbed(id: string): EmbedResult {
  return {
    kind: 'iframe',
    provider: 'youtube',
    src: `https://www.youtube-nocookie.com/embed/${id}`,
    aspectRatio: '16:9',
  };
}
