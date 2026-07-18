/**
 * Resolve a slide / video URL to an embeddable iframe, or fall back to a plain
 * link. Pure and offline: only URLs that carry everything an embed needs in the
 * URL itself are recognized. Anything unrecognized, malformed, non-https, or
 * requiring a network lookup (oEmbed, data-id) returns `{ kind: 'link' }`.
 */

/** A resolved embed: an iframe with a provider + src + aspect ratio, or a plain link. */
export type EmbedResult =
  | { kind: 'iframe'; provider: string; src: string; aspectRatio: '16:9' | '4:3' }
  | { kind: 'link' };

const LINK: EmbedResult = { kind: 'link' };

/** YouTube video IDs: 11 chars in practice, but accept the documented charset. */
const YOUTUBE_ID = /^[A-Za-z0-9_-]{6,}$/;

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
  if (host === 'youtu.be') {
    const id = segments[0];
    if (id && YOUTUBE_ID.test(id)) {
      return youtubeEmbed(id);
    }
    return LINK;
  }
  if (host === 'youtube.com' || host === 'm.youtube.com') {
    if (parsed.pathname === '/watch') {
      const id = parsed.searchParams.get('v');
      if (id && YOUTUBE_ID.test(id)) return youtubeEmbed(id);
      return LINK;
    }
    if (segments[0] === 'embed' || segments[0] === 'shorts') {
      const id = segments[1];
      if (id && YOUTUBE_ID.test(id)) return youtubeEmbed(id);
    }
    return LINK;
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
  // SpeakerDeck embeds need the data-id, which is NOT present in a public
  // `speakerdeck.com/USER/SLUG` URL (it requires an oEmbed lookup we can't do
  // offline). Only an already-resolved `speakerdeck.com/player/HEXID` embed URL
  // is embeddable here.
  if (host === 'speakerdeck.com') {
    if (segments[0] === 'player' && segments[1]) {
      return { kind: 'iframe', provider: 'speakerdeck', src: parsed.href, aspectRatio: '4:3' };
    }
    return LINK;
  }

  // --- SlideShare ---
  // Public slideshare.net URLs need an oEmbed lookup for the embed_code id, which
  // we can't do offline. Only an already-resolved embed URL is embeddable.
  if (host === 'slideshare.net') {
    if (segments[0] === 'slideshow' && segments[1] === 'embed_code') {
      return { kind: 'iframe', provider: 'slideshare', src: parsed.href, aspectRatio: '4:3' };
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
