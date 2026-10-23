import { describe, expect, it } from 'vitest';
import { splitRoadmapBody } from './board-body.js';

describe('splitRoadmapBody', () => {
  it('separates the description from the tracking issue links', () => {
    expect(
      splitRoadmapBody(
        'Pull in posts from RSS feeds.\n\nTracking: https://github.com/singi-labs/sifa-workspace/issues/153, https://github.com/singi-labs/sifa-workspace/issues/111',
      ),
    ).toEqual({
      description: 'Pull in posts from RSS feeds.',
      issues: [
        { number: 153, url: 'https://github.com/singi-labs/sifa-workspace/issues/153' },
        { number: 111, url: 'https://github.com/singi-labs/sifa-workspace/issues/111' },
      ],
    });
  });

  it('keeps a body without a tracking line as the description', () => {
    expect(splitRoadmapBody('Native iOS and Android apps.')).toEqual({
      description: 'Native iOS and Android apps.',
      issues: [],
    });
  });

  it('only links issues in the roadmap issues repo, and keeps other lines as text', () => {
    expect(splitRoadmapBody('Idea.\n\nTracking: https://evil.example/issues/1')).toEqual({
      description: 'Idea.\n\nTracking: https://evil.example/issues/1',
      issues: [],
    });
    expect(
      splitRoadmapBody('Idea.\nTracking: https://github.com/attacker/phish/issues/1').issues,
    ).toEqual([]);
  });

  it('keeps a "Tracking:" line that holds no issue link', () => {
    expect(splitRoadmapBody('Tracking: my reading progress across devices')).toEqual({
      description: 'Tracking: my reading progress across devices',
      issues: [],
    });
  });

  it('tolerates trailing punctuation and angle brackets around issue links', () => {
    expect(
      splitRoadmapBody(
        'X.\nTracking: <https://github.com/singi-labs/sifa-workspace/issues/7>, https://github.com/singi-labs/sifa-workspace/issues/8.',
      ).issues.map((i) => i.number),
    ).toEqual([7, 8]);
  });

  it('handles a missing body', () => {
    expect(splitRoadmapBody(null)).toEqual({ description: null, issues: [] });
    expect(splitRoadmapBody('  ')).toEqual({ description: null, issues: [] });
  });
});
