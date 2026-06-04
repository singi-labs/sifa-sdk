import { describe, expect, it } from 'vitest';
import { ADULT_CONTENT_LABELS } from '../../cards/adult-content.js';
import {
  effectiveContentVisibility,
  shouldGateAdultMedia,
  type BskyContentLabelPrefs,
} from './bsky-preferences.js';

const emptyPrefs: BskyContentLabelPrefs = {
  porn: null,
  sexual: null,
  nudity: null,
  'graphic-media': null,
};

describe('effectiveContentVisibility', () => {
  it('always returns hide for anonymous viewers', () => {
    expect(effectiveContentVisibility('porn', null, false)).toBe('hide');
    expect(effectiveContentVisibility('porn', { ...emptyPrefs, porn: 'ignore' }, false)).toBe(
      'hide',
    );
  });

  it('returns hide for authenticated viewers without an explicit pref', () => {
    expect(effectiveContentVisibility('porn', emptyPrefs, true)).toBe('hide');
    expect(effectiveContentVisibility('porn', null, true)).toBe('hide');
  });

  it('returns the explicit pref for authenticated viewers', () => {
    expect(effectiveContentVisibility('porn', { ...emptyPrefs, porn: 'ignore' }, true)).toBe(
      'ignore',
    );
    expect(effectiveContentVisibility('porn', { ...emptyPrefs, porn: 'warn' }, true)).toBe('warn');
    expect(effectiveContentVisibility('porn', { ...emptyPrefs, porn: 'hide' }, true)).toBe('hide');
  });
});

describe('shouldGateAdultMedia', () => {
  it('returns false when there are no labels', () => {
    expect(shouldGateAdultMedia(undefined, emptyPrefs, true)).toBe(false);
    expect(shouldGateAdultMedia([], emptyPrefs, true)).toBe(false);
  });

  it('returns true for adult labels when anonymous regardless of prefs', () => {
    for (const val of ADULT_CONTENT_LABELS) {
      expect(shouldGateAdultMedia([{ val }], { ...emptyPrefs, [val]: 'ignore' }, false)).toBe(true);
    }
  });

  it('returns true for adult labels when authenticated with no/null pref', () => {
    expect(shouldGateAdultMedia([{ val: 'porn' }], emptyPrefs, true)).toBe(true);
    expect(shouldGateAdultMedia([{ val: 'porn' }], null, true)).toBe(true);
  });

  it('returns false when authenticated viewer set the label to ignore', () => {
    expect(shouldGateAdultMedia([{ val: 'porn' }], { ...emptyPrefs, porn: 'ignore' }, true)).toBe(
      false,
    );
  });

  it('still gates when any other adult label needs gating', () => {
    expect(
      shouldGateAdultMedia(
        [{ val: 'porn' }, { val: 'nudity' }],
        { ...emptyPrefs, porn: 'ignore' },
        true,
      ),
    ).toBe(true);
  });

  it('ignores negated and non-adult labels', () => {
    expect(shouldGateAdultMedia([{ val: 'porn', neg: true }], emptyPrefs, true)).toBe(false);
    expect(shouldGateAdultMedia([{ val: 'spam' }], emptyPrefs, true)).toBe(false);
  });
});
