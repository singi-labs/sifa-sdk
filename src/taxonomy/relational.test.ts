import { describe, it, expect } from 'vitest';
import { isRelationalActivity } from './relational.js';

describe('isRelationalActivity', () => {
  it('flags reactions and references to someone else’s thing', () => {
    for (const nsid of [
      'pub.leaflet.comment',
      'fm.plyr.comment',
      'app.userinput.reply',
      'community.lexicon.calendar.rsvp',
      'app.bsky.feed.like',
      'app.bsky.graph.follow',
      'at.youandme.connection',
      'fund.at.graph.endorse',
      'dev.atvouch.graph.vouch',
      'community.lexicon.bookmarks.bookmark',
      'eu.atcommons.member',
      'social.colibri.membership',
    ]) {
      expect(isRelationalActivity(nsid), nsid).toBe(true);
    }
  });

  it('does not flag the actor’s own authored creations', () => {
    for (const nsid of [
      'app.bsky.feed.post',
      'com.whtwnd.blog.entry',
      'social.grain.gallery',
      'github.pull_request',
      'buzz.bookhive.book',
      'blog.pckt.mini.post',
    ]) {
      expect(isRelationalActivity(nsid), nsid).toBe(false);
    }
  });

  it('is safe on empty or malformed input', () => {
    expect(isRelationalActivity('')).toBe(false);
    expect(isRelationalActivity('nodots')).toBe(false);
  });
});
