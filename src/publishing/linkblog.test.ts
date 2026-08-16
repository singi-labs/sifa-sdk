import { describe, it, expect } from 'vitest';

import {
  SKYREADER_LINKBLOG_MARKER_URL,
  isLinkblogPublication,
  isLinkblogShareDocument,
} from './index.js';

/**
 * A real Skyreader linkblog document, fetched from
 * at://did:plc:ijszkrwgabtihk7td653q6gb/site.standard.document/3mt3r36rot2om.
 * Trimmed to the fields the predicate reads. The user shared an external
 * article ("interconnects.ai"); the doc lives in their own linkblog
 * publication and carries the Skyreader provenance marker.
 */
const REAL_SKYREADER_SHARE = {
  $type: 'site.standard.document',
  site: 'at://did:plc:ijszkrwgabtihk7td653q6gb/site.standard.publication/3mstjk7sct22d',
  title: 'GLM-5.3: How Chinese labs keep stride with the frontier',
  path: '/3mt3r36rot2om',
  publishedAt: '2026-08-14T21:23:35.000Z',
  links: [
    { rel: 'related', uri: 'https://www.interconnects.ai/p/glm-53-how-chinese-labs-keep-stride' },
  ],
  skyreaderLinkblog: 'https://skyreader.app/linkblog',
};

describe('isLinkblogPublication', () => {
  it('is true when the publication carries the Skyreader marker', () => {
    expect(
      isLinkblogPublication({
        url: 'https://linkblogs.skyreader.app/did',
        name: "Someone's linkblog",
        skyreaderLinkblog: SKYREADER_LINKBLOG_MARKER_URL,
      }),
    ).toBe(true);
  });

  it('is false for an ordinary authored publication', () => {
    expect(isLinkblogPublication({ url: 'https://blog.example.com', name: 'My Blog' })).toBe(false);
  });

  it('is false for non-object input', () => {
    expect(isLinkblogPublication(null)).toBe(false);
    expect(isLinkblogPublication('nope')).toBe(false);
  });
});

describe('isLinkblogShareDocument', () => {
  it('is true for a real Skyreader linkblog share (marker present)', () => {
    expect(isLinkblogShareDocument(REAL_SKYREADER_SHARE)).toBe(true);
  });

  it('is true when the parent publication is a linkblog, even without a doc marker', () => {
    const { skyreaderLinkblog: _omit, ...noMarker } = REAL_SKYREADER_SHARE;
    expect(isLinkblogShareDocument(noMarker, { publicationIsLinkblog: true })).toBe(true);
  });

  it('is true for a quote-reshare (links rel "repost")', () => {
    expect(
      isLinkblogShareDocument({
        site: 'at://did:plc:xyz/site.standard.publication/abc',
        title: 'Re: something',
        links: [{ rel: 'repost', uri: 'at://did:plc:other/site.standard.document/q' }],
      }),
    ).toBe(true);
  });

  it('is true when a "related" link points to an external host different from the publication host', () => {
    const { skyreaderLinkblog: _omit, ...noMarker } = REAL_SKYREADER_SHARE;
    expect(isLinkblogShareDocument(noMarker, { publicationHost: 'linkblogs.skyreader.app' })).toBe(
      true,
    );
  });

  it('is false for an authored doc whose "related" link is on its own publication host', () => {
    expect(
      isLinkblogShareDocument(
        {
          site: 'https://blog.example.com',
          title: 'My essay',
          textContent: 'Long original writing...',
          links: [{ rel: 'related', uri: 'https://blog.example.com/earlier-post' }],
        },
        { publicationHost: 'blog.example.com' },
      ),
    ).toBe(false);
  });

  it('is false for an authored doc with a related external link when the publication is NOT known to be a linkblog and host is unknown', () => {
    // Conservative: without a marker, a known linkblog publication, or a
    // resolvable publication host, an external "related" link alone must not
    // hide a real authored post.
    expect(
      isLinkblogShareDocument({
        site: 'at://did:plc:author/site.standard.publication/blog',
        title: 'My essay',
        textContent: 'Long original writing...',
        links: [{ rel: 'related', uri: 'https://someone-else.com/reference' }],
      }),
    ).toBe(false);
  });

  it('is false for a plain authored doc with no links and no marker', () => {
    expect(
      isLinkblogShareDocument({
        site: 'at://did:plc:author/site.standard.publication/blog',
        title: 'My essay',
        textContent: 'Long original writing...',
      }),
    ).toBe(false);
  });

  it('is false for non-object input', () => {
    expect(isLinkblogShareDocument(null)).toBe(false);
    expect(isLinkblogShareDocument(42)).toBe(false);
  });
});
