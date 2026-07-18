import { describe, it, expect } from 'vitest';
import { resolveEmbed } from './embed.js';

describe('resolveEmbed', () => {
  it('resolves YouTube watch, youtu.be, embed, and shorts URLs to a nocookie iframe', () => {
    const expected = {
      kind: 'iframe',
      provider: 'youtube',
      src: 'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ',
      aspectRatio: '16:9',
    };
    expect(resolveEmbed('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toEqual(expected);
    expect(resolveEmbed('https://youtu.be/dQw4w9WgXcQ')).toEqual(expected);
    expect(resolveEmbed('https://youtu.be/dQw4w9WgXcQ?t=30')).toEqual(expected);
    expect(resolveEmbed('https://www.youtube.com/embed/dQw4w9WgXcQ')).toEqual(expected);
    expect(resolveEmbed('https://www.youtube.com/shorts/dQw4w9WgXcQ')).toEqual(expected);
    expect(resolveEmbed('https://m.youtube.com/watch?v=dQw4w9WgXcQ')).toEqual(expected);
  });

  it('rejects a YouTube URL with no / too-short video id', () => {
    expect(resolveEmbed('https://www.youtube.com/watch?v=abc')).toEqual({ kind: 'link' });
    expect(resolveEmbed('https://www.youtube.com/watch')).toEqual({ kind: 'link' });
  });

  it('resolves Vimeo watch and player URLs', () => {
    const expected = {
      kind: 'iframe',
      provider: 'vimeo',
      src: 'https://player.vimeo.com/video/123456789',
      aspectRatio: '16:9',
    };
    expect(resolveEmbed('https://vimeo.com/123456789')).toEqual(expected);
    expect(resolveEmbed('https://player.vimeo.com/video/123456789')).toEqual(expected);
  });

  it('does not resolve a non-numeric Vimeo path', () => {
    expect(resolveEmbed('https://vimeo.com/channels/staffpicks')).toEqual({ kind: 'link' });
  });

  it('resolves SpeakerDeck only for an already-embed player URL', () => {
    expect(resolveEmbed('https://speakerdeck.com/someuser/my-great-talk')).toEqual({
      kind: 'link',
    });
    expect(resolveEmbed('https://speakerdeck.com/player/abc123def456')).toEqual({
      kind: 'iframe',
      provider: 'speakerdeck',
      src: 'https://speakerdeck.com/player/abc123def456',
      aspectRatio: '4:3',
    });
  });

  it('resolves SlideShare only for an already-embed_code URL', () => {
    expect(resolveEmbed('https://www.slideshare.net/someuser/my-deck')).toEqual({ kind: 'link' });
    expect(resolveEmbed('https://www.slideshare.net/slideshow/embed_code/key/abc123')).toEqual({
      kind: 'iframe',
      provider: 'slideshare',
      src: 'https://www.slideshare.net/slideshow/embed_code/key/abc123',
      aspectRatio: '4:3',
    });
  });

  it('resolves Google Slides edit/pub/view URLs to an embed iframe', () => {
    const expected = {
      kind: 'iframe',
      provider: 'googleslides',
      src: 'https://docs.google.com/presentation/d/1AbCdEf/embed',
      aspectRatio: '16:9',
    };
    expect(resolveEmbed('https://docs.google.com/presentation/d/1AbCdEf/edit')).toEqual(expected);
    expect(resolveEmbed('https://docs.google.com/presentation/d/1AbCdEf/pub?start=false')).toEqual(
      expected,
    );
  });

  it('resolves Loom share URLs', () => {
    expect(resolveEmbed('https://www.loom.com/share/abc123')).toEqual({
      kind: 'iframe',
      provider: 'loom',
      src: 'https://www.loom.com/embed/abc123',
      aspectRatio: '16:9',
    });
  });

  it('resolves Canva design view URLs', () => {
    expect(resolveEmbed('https://www.canva.com/design/DAF123/view')).toEqual({
      kind: 'iframe',
      provider: 'canva',
      src: 'https://www.canva.com/design/DAF123/view?embed',
      aspectRatio: '16:9',
    });
  });

  it('returns a link for unrecognized, malformed, or non-https URLs', () => {
    expect(resolveEmbed('https://example.com/some/page')).toEqual({ kind: 'link' });
    expect(resolveEmbed('not a url')).toEqual({ kind: 'link' });
    expect(resolveEmbed('http://www.youtube.com/watch?v=dQw4w9WgXcQ')).toEqual({ kind: 'link' });
    expect(resolveEmbed('')).toEqual({ kind: 'link' });
  });
});
