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

  it('only turns GitHub issue URLs into issue links', () => {
    expect(splitRoadmapBody('Idea.\n\nTracking: https://evil.example/issues/1').issues).toEqual([]);
  });

  it('handles a missing body', () => {
    expect(splitRoadmapBody(null)).toEqual({ description: null, issues: [] });
    expect(splitRoadmapBody('  ')).toEqual({ description: null, issues: [] });
  });
});
