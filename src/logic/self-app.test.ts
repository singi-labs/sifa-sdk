import { describe, expect, it } from 'vitest';

import { SELF_APP_ID, excludeSelfApp } from './self-app.js';

describe('SELF_APP_ID', () => {
  it('is the canonical "sifa" app id', () => {
    expect(SELF_APP_ID).toBe('sifa');
  });
});

describe('excludeSelfApp', () => {
  it('drops the synthetic Sifa entry', () => {
    const apps = [
      { id: 'sifa', name: 'Sifa' },
      { id: 'bluesky', name: 'Bluesky' },
      { id: 'github', name: 'GitHub' },
    ];
    expect(excludeSelfApp(apps).map((a) => a.id)).toEqual(['bluesky', 'github']);
  });

  it('leaves a list without Sifa unchanged', () => {
    const apps = [
      { id: 'bluesky', name: 'Bluesky' },
      { id: 'github', name: 'GitHub' },
    ];
    expect(excludeSelfApp(apps).map((a) => a.id)).toEqual(['bluesky', 'github']);
  });

  it('returns an empty array for an empty input', () => {
    expect(excludeSelfApp([])).toEqual([]);
  });

  it('drops every Sifa entry if somehow duplicated', () => {
    const apps = [
      { id: 'sifa', name: 'Sifa' },
      { id: 'bluesky', name: 'Bluesky' },
      { id: 'sifa', name: 'Sifa' },
    ];
    expect(excludeSelfApp(apps).map((a) => a.id)).toEqual(['bluesky']);
  });

  it('preserves the original order of the remaining apps', () => {
    const apps = [
      { id: 'github', name: 'GitHub' },
      { id: 'sifa', name: 'Sifa' },
      { id: 'bluesky', name: 'Bluesky' },
    ];
    expect(excludeSelfApp(apps).map((a) => a.id)).toEqual(['github', 'bluesky']);
  });
});
