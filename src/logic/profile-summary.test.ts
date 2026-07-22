import { describe, expect, it } from 'vitest';

import { summarizeProfileView } from './profile-summary.js';
import type { ProfileView } from '../types/profile-view.js';

function view(overrides: Partial<ProfileView> = {}): ProfileView {
  return { did: 'did:plc:abc', handle: 'alice.example', ...overrides };
}

describe('summarizeProfileView', () => {
  it('carries over core identity and headline fields', () => {
    const summary = summarizeProfileView(
      view({
        displayName: 'Alice',
        avatar: 'https://cdn/a.jpg',
        pronouns: 'she/her',
        headline: 'Builder',
      }),
    );

    expect(summary).toMatchObject({
      did: 'did:plc:abc',
      handle: 'alice.example',
      displayName: 'Alice',
      avatar: 'https://cdn/a.jpg',
      pronouns: 'she/her',
      headline: 'Builder',
    });
  });

  it('derives current role from the primary active position', () => {
    const summary = summarizeProfileView(
      view({
        positions: [
          {
            rkey: '1',
            title: 'Old Job',
            company: 'Past Inc',
            startedAt: '2018-01',
            endedAt: '2020-01',
          },
          { rkey: '2', title: 'Staff Engineer', company: 'Acme', startedAt: '2021-01' },
        ],
      }),
    );

    expect(summary.currentTitle).toBe('Staff Engineer');
    expect(summary.currentCompany).toBe('Acme');
  });

  it('prefers the resolved entity name over free-text company', () => {
    const summary = summarizeProfileView(
      view({
        positions: [
          {
            rkey: '1',
            title: 'PM',
            company: 'acme.com',
            entityRef: 'at://x',
            entityName: 'Acme Corp',
            startedAt: '2022-01',
          },
        ],
      }),
    );

    expect(summary.currentCompany).toBe('Acme Corp');
  });

  it('leaves current role undefined when there is no active position', () => {
    const summary = summarizeProfileView(
      view({
        positions: [
          { rkey: '1', title: 'Ex', company: 'Gone', startedAt: '2018-01', endedAt: '2020-01' },
        ],
      }),
    );

    expect(summary.currentTitle).toBeUndefined();
    expect(summary.currentCompany).toBeUndefined();
  });

  it('caps topSkills at five by default, preserving order', () => {
    const summary = summarizeProfileView(
      view({ skills: Array.from({ length: 8 }, (_, i) => ({ rkey: String(i), name: `s${i}` })) }),
    );

    expect(summary.topSkills).toEqual(['s0', 's1', 's2', 's3', 's4']);
  });

  it('respects a custom maxSkills, treating negatives as zero', () => {
    const skills = [
      { rkey: '0', name: 'a' },
      { rkey: '1', name: 'b' },
      { rkey: '2', name: 'c' },
    ];

    expect(summarizeProfileView(view({ skills }), { maxSkills: 2 }).topSkills).toEqual(['a', 'b']);
    expect(summarizeProfileView(view({ skills }), { maxSkills: 0 }).topSkills).toEqual([]);
    expect(summarizeProfileView(view({ skills }), { maxSkills: -3 }).topSkills).toEqual([]);
  });

  it('defaults topSkills to an empty array and claimed to false', () => {
    const summary = summarizeProfileView(view());

    expect(summary.topSkills).toEqual([]);
    expect(summary.claimed).toBe(false);
  });

  it('reflects the claimed flag when present', () => {
    expect(summarizeProfileView(view({ claimed: true })).claimed).toBe(true);
  });
});
