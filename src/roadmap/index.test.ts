import { describe, expect, it } from 'vitest';

import { roadmapIssueUrl } from './index.js';

describe('roadmapIssueUrl', () => {
  it('builds sifa-workspace issue URLs', () => {
    expect(roadmapIssueUrl(114)).toBe('https://github.com/singi-labs/sifa-workspace/issues/114');
  });
});
