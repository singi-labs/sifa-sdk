import { describe, expect, it } from 'vitest';

import type { ActivityItem } from './activity-item.js';
import { streamCardVMSchema } from './stream-card-vm-schema.js';
import { toStreamCardVM, toStreamCardVMs } from './to-stream-card-vm.js';

const DID = 'did:plc:author';

function bskyPost(overrides: Partial<ActivityItem> = {}): ActivityItem {
  return {
    uri: `at://${DID}/app.bsky.feed.post/3kpost`,
    cid: 'bafyreipost',
    collection: 'app.bsky.feed.post',
    rkey: '3kpost',
    appId: 'bluesky',
    appName: 'Bluesky',
    category: 'Posts',
    indexedAt: '2026-07-17T12:00:00.000Z',
    record: {
      $type: 'app.bsky.feed.post',
      text: 'hello sky',
      createdAt: '2026-07-17T11:59:00.000Z',
    },
    ...overrides,
  };
}

describe('toStreamCardVM — verb titles', () => {
  it('drops the app name for plain posts (the source pill already shows it)', () => {
    expect(toStreamCardVM(bskyPost()).title).toBe('Posted');
  });

  it('drops the app name for reposts', () => {
    const repost = bskyPost({
      uri: `at://${DID}/app.bsky.feed.repost/3krp`,
      collection: 'app.bsky.feed.repost',
      rkey: '3krp',
      record: { $type: 'app.bsky.feed.repost', createdAt: '2026-07-17T11:00:00.000Z' },
    });
    expect(toStreamCardVM(repost).title).toBe('Reposted');
  });

  it('titles a Popfeed review with the "reviewed" verb, keeping the app', () => {
    const review = bskyPost({
      uri: `at://${DID}/social.popfeed.feed.review/3krv`,
      collection: 'social.popfeed.feed.review',
      rkey: '3krv',
      appId: 'popfeed',
      appName: 'Popfeed',
      record: { title: 'Sugar', createdAt: '2026-07-17T11:00:00.000Z' },
    });
    const vm = toStreamCardVM(review);
    expect(vm.verb).toBe('reviewed');
    expect(vm.title).toBe('Reviewed on Popfeed');
  });

  it('uses "Shared on {app}" for the generic fallback', () => {
    const item = bskyPost({
      uri: `at://${DID}/com.example.widget/1`,
      collection: 'com.example.widget',
      rkey: '1',
      appId: 'com.example',
      appName: 'Example',
      record: { name: 'a widget' },
    });
    const vm = toStreamCardVM(item);
    expect(vm.verb).toBe('created');
    expect(vm.title).toBe('Shared on Example');
  });
});

describe('toStreamCardVM — generic / unknown', () => {
  const item: ActivityItem = {
    uri: `at://${DID}/com.example.widget/1`,
    cid: 'bafyreiwidget',
    collection: 'com.example.widget',
    rkey: '1',
    appId: 'com.example',
    appName: 'Example',
    category: 'Other',
    indexedAt: '2026-07-17T09:00:00.000Z',
    record: { name: 'a widget' },
  };

  it('produces a schema-valid VM with the default verb and extracts record text', () => {
    const vm = toStreamCardVM(item);
    expect(streamCardVMSchema.safeParse(vm).success).toBe(true);
    expect(vm.verb).toBe('created');
    // Unknown collections fall back to the "Shared on {app}" title.
    expect(vm.title).toBe('Shared on Example');
    // `name` is a recognized human-visible field → a text body.
    expect(vm.body).toEqual({ kind: 'text', text: 'a widget' });
  });

  it('degrades to an empty generic body when no content field is present', () => {
    const vm = toStreamCardVM({ ...item, record: { createdAt: '2026-07-17T09:00:00.000Z' } });
    expect(streamCardVMSchema.safeParse(vm).success).toBe(true);
    expect(vm.body).toEqual({ kind: 'generic' });
    expect(vm.media).toBeUndefined();
    expect(vm.externalLink).toBeUndefined();
  });

  it('defaults source.color to a token name (not a hex literal)', () => {
    const vm = toStreamCardVM(item);
    expect(vm.source).toEqual({ appId: 'com.example', label: 'Example', color: 'slate' });
    expect(vm.source.color).not.toMatch(/^#/);
  });

  it('resolves source.color through the injected resolver when provided', () => {
    const vm = toStreamCardVM(item, {
      resolveSourceColor: (id) => (id === 'com.example' ? 'indigo' : undefined),
    });
    expect(vm.source.color).toBe('indigo');
  });

  it('falls back to indexedAt when the record has no createdAt', () => {
    const vm = toStreamCardVM(item);
    expect(vm.timestamp).toBe('2026-07-17T09:00:00.000Z');
  });

  it('reads a validated publicationTheme off the record when present', () => {
    const themed = toStreamCardVM({
      ...item,
      record: {
        name: 'themed',
        publicationTheme: {
          background: { r: 10, g: 20, b: 30 },
          foreground: { r: 240, g: 240, b: 240 },
          accent: { r: 67, g: 133, b: 190 },
        },
      },
    });
    expect(themed.theme?.accent).toEqual({ r: 67, g: 133, b: 190 });
  });

  it('ignores an invalid publicationTheme', () => {
    const vm = toStreamCardVM({
      ...item,
      record: { name: 'x', publicationTheme: { background: { r: 999, g: 0, b: 0 } } },
    });
    expect(vm.theme).toBeUndefined();
  });
});

describe('toStreamCardVM — Bluesky post', () => {
  it('maps text into a text body and prefers record.createdAt for the timestamp', () => {
    const vm = toStreamCardVM(bskyPost());
    expect(vm.verb).toBe('posted');
    expect(vm.tier).toBe('creation');
    expect(vm.body).toEqual({ kind: 'text', text: 'hello sky' });
    expect(vm.timestamp).toBe('2026-07-17T11:59:00.000Z');
    expect(streamCardVMSchema.safeParse(vm).success).toBe(true);
  });

  it('carries image embeds as blob refs (did + cid), not resolved URLs', () => {
    const vm = toStreamCardVM(
      bskyPost({
        record: {
          text: 'with pics',
          createdAt: '2026-07-17T11:00:00.000Z',
          embed: {
            $type: 'app.bsky.embed.images',
            images: [
              {
                alt: 'a cat',
                image: { $type: 'blob', ref: { $link: 'bafkreicat' }, mimeType: 'image/jpeg' },
                aspectRatio: { width: 1000, height: 750 },
              },
            ],
          },
        },
      }),
    );
    expect(vm.media).toHaveLength(1);
    expect(vm.media?.[0]).toEqual({
      did: DID,
      cid: 'bafkreicat',
      alt: 'a cat',
      aspectRatio: { width: 1000, height: 750 },
      mimeType: 'image/jpeg',
    });
    // Blob refs, not baked CDN URLs.
    expect(JSON.stringify(vm.media)).not.toContain('cdn.bsky.app');
    expect(streamCardVMSchema.safeParse(vm).success).toBe(true);
  });

  it('maps an external embed into externalLink', () => {
    const vm = toStreamCardVM(
      bskyPost({
        record: {
          text: '',
          createdAt: '2026-07-17T11:00:00.000Z',
          embed: {
            $type: 'app.bsky.embed.external',
            external: {
              uri: 'https://example.com/article',
              title: 'An Article',
              description: 'desc',
            },
          },
        },
      }),
    );
    expect(vm.externalLink).toEqual({ url: 'https://example.com/article', title: 'An Article' });
    // No text → body reflects the primary content (a link).
    expect(vm.body).toEqual({ kind: 'link' });
    expect(streamCardVMSchema.safeParse(vm).success).toBe(true);
  });

  it('unwraps recordWithMedia to reach the image blobs', () => {
    const vm = toStreamCardVM(
      bskyPost({
        record: {
          text: 'quote + pic',
          createdAt: '2026-07-17T11:00:00.000Z',
          embed: {
            $type: 'app.bsky.embed.recordWithMedia',
            record: { record: { uri: 'at://did:plc:x/app.bsky.feed.post/y', cid: 'bafq' } },
            media: {
              $type: 'app.bsky.embed.images',
              images: [{ alt: '', image: { $type: 'blob', ref: { $link: 'bafkreipic' } } }],
            },
          },
        },
      }),
    );
    expect(vm.media?.[0]).toMatchObject({ did: DID, cid: 'bafkreipic' });
  });
});

describe('toStreamCardVM — repost', () => {
  it('normalizes the subject through the same transform as a post subject', () => {
    const repost: ActivityItem = {
      uri: `at://${DID}/app.bsky.feed.repost/3krepost`,
      cid: 'bafyreirepost',
      collection: 'app.bsky.feed.repost',
      rkey: '3krepost',
      appId: 'bluesky',
      appName: 'Bluesky',
      category: 'Posts',
      indexedAt: '2026-07-17T13:00:00.000Z',
      record: {
        $type: 'app.bsky.feed.repost',
        subject: { uri: `at://${DID}/app.bsky.feed.post/3kpost`, cid: 'bafyreipost' },
        createdAt: '2026-07-17T13:00:00.000Z',
      },
      subject: bskyPost(),
    };
    const vm = toStreamCardVM(repost);
    expect(vm.verb).toBe('reposted');
    expect(vm.subject?.kind).toBe('post');
    if (vm.subject?.kind === 'post') {
      expect(vm.subject.post.verb).toBe('posted');
      expect(vm.subject.post.body).toEqual({ kind: 'text', text: 'hello sky' });
    }
    expect(streamCardVMSchema.safeParse(vm).success).toBe(true);
  });
});

describe('toStreamCardVMs — batch + visibility filter', () => {
  it('drops items that fail isVisibleActivityItem and maps the rest', () => {
    const visible = bskyPost();
    const hidden: ActivityItem = {
      uri: `at://${DID}/at.margin.bookmark/1`,
      cid: 'bafyreibm',
      collection: 'at.margin.bookmark',
      rkey: '1',
      appId: 'margin',
      appName: 'Margin',
      category: 'Other',
      indexedAt: '2026-07-17T08:00:00.000Z',
      record: { note: 'no source url here' },
    };
    const vms = toStreamCardVMs([visible, hidden]);
    expect(vms).toHaveLength(1);
    expect(vms[0]?.uri).toBe(visible.uri);
  });
});
