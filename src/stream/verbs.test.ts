import { describe, expect, it } from 'vitest';

import {
  ACTIVITY_VERBS,
  STREAM_VERBS,
  getActivityVerbsVersion,
  streamVerbSchema,
  verbForCollection,
} from './verbs.js';

describe('verbForCollection', () => {
  it('maps Bluesky posts to "posted"', () => {
    expect(verbForCollection('app.bsky.feed.post')).toBe('posted');
  });

  it('maps Bluesky reposts to "reposted"', () => {
    expect(verbForCollection('app.bsky.feed.repost')).toBe('reposted');
  });

  it('maps long-form publishing lexicons to "published"', () => {
    expect(verbForCollection('com.whtwnd.blog.entry')).toBe('published');
    expect(verbForCollection('site.standard.document')).toBe('published');
  });

  it('maps Sifa endorsements to "endorsed"', () => {
    expect(verbForCollection('id.sifa.endorsement')).toBe('endorsed');
  });

  it('falls back to the default verb for unknown collections', () => {
    expect(verbForCollection('com.example.not.real')).toBe(ACTIVITY_VERBS.defaultVerb);
    expect(verbForCollection('com.example.not.real')).toBe('created');
  });

  it('falls back to the default verb for an empty string without throwing', () => {
    expect(verbForCollection('')).toBe('created');
  });
});

describe('ACTIVITY_VERBS map', () => {
  it('every mapped verb is a member of the StreamVerb union', () => {
    const valid = new Set<string>(STREAM_VERBS);
    for (const verb of Object.values(ACTIVITY_VERBS.verbs)) {
      expect(valid.has(verb)).toBe(true);
    }
    expect(streamVerbSchema.safeParse(ACTIVITY_VERBS.defaultVerb).success).toBe(true);
  });

  it('is frozen (read-only)', () => {
    expect(Object.isFrozen(ACTIVITY_VERBS)).toBe(true);
  });
});

describe('getActivityVerbsVersion', () => {
  it('returns a semver version and an ISO date', () => {
    const version = getActivityVerbsVersion();
    expect(version.version).toMatch(/^\d+\.\d+\.\d+$/);
    expect(version.updated).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

describe('relational verbs', () => {
  it('maps memberships to joined and comments/rsvps to relational verbs', () => {
    expect(verbForCollection('eu.atcommons.member')).toBe('joined');
    expect(verbForCollection('social.colibri.membership')).toBe('joined');
    expect(verbForCollection('pub.leaflet.comment')).toBe('commented');
    expect(verbForCollection('app.userinput.reply')).toBe('replied');
    expect(verbForCollection('community.lexicon.calendar.rsvp')).toBe('rsvped');
    expect(verbForCollection('at.youandme.connection')).toBe('metWith');
  });
});

describe('per-app verb copy', () => {
  it('maps app collections to their own verb instead of the "created"/"Shared" default', () => {
    expect(verbForCollection('place.stream.livestream')).toBe('streamed');
    expect(verbForCollection('fyi.atstore.listing.review')).toBe('reviewed');
    expect(verbForCollection('blog.pckt.mini.post')).toBe('wrote');
    expect(verbForCollection('app.beaconbits.beacon')).toBe('wasAt');
    expect(verbForCollection('social.grain.gallery')).toBe('posted');
    expect(verbForCollection('fund.at.graph.endorse')).toBe('supported');
    expect(verbForCollection('dev.keytrace.claim')).toBe('verified');
  });
});

describe('marque domains', () => {
  it('registers a Marque domain', () => {
    expect(verbForCollection('at.marque.domain')).toBe('registered');
  });
});

describe('margin notes', () => {
  it('annotates a Margin note', () => {
    expect(verbForCollection('at.margin.note')).toBe('annotated');
  });
});
