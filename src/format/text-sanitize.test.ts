import { describe, expect, it } from 'vitest';

import { limitCombiningMarks, sanitizeDisplayText } from './text-sanitize.js';

describe('limitCombiningMarks', () => {
  it('returns plain ASCII unchanged', () => {
    expect(limitCombiningMarks('hello world')).toBe('hello world');
  });

  it('returns empty string unchanged', () => {
    expect(limitCombiningMarks('')).toBe('');
  });

  it('preserves single combining marks (é via NFD)', () => {
    const nfd = 'é'; // e + COMBINING ACUTE ACCENT
    expect(limitCombiningMarks(nfd)).toBe(nfd);
  });

  it('preserves up to 4 combining marks per base by default', () => {
    const input = 'á̂̃̄';
    expect(limitCombiningMarks(input)).toBe('á̂̃̄');
  });

  it('drops combining marks beyond the cap', () => {
    const input = 'a' + '́'.repeat(50);
    expect(limitCombiningMarks(input)).toBe('a' + '́'.repeat(4));
  });

  it('resets the counter on each base character', () => {
    const input = 'a' + '́'.repeat(10) + 'b' + '̂'.repeat(10);
    expect(limitCombiningMarks(input)).toBe('a' + '́'.repeat(4) + 'b' + '̂'.repeat(4));
  });

  it('collapses classic Zalgo into readable text', () => {
    const zalgo = 'T̸̢̢̛̜̘̪̬̪̪̳̞̭̘̩̲̭̭̩̳h̵̢̧̛̛̘̘̬̭̩̲̩̪̘̩̘̘̩̘̪̪i̷̢̧̛̘̘̘̬̬̬̭̩̘̩̲̘̘̘̩̘̘̩̘s';
    const out = limitCombiningMarks(zalgo);
    // base characters preserved
    expect(out).toMatch(/^T.{0,4}h.{0,4}i.{0,4}s.{0,4}$/u);
    // no run longer than 4 combining marks
    expect(/\p{M}{5,}/u.test(out)).toBe(false);
  });

  it('respects a custom cap', () => {
    const input = 'a' + '́'.repeat(10);
    expect(limitCombiningMarks(input, 1)).toBe('á');
    expect(limitCombiningMarks(input, 0)).toBe('a');
  });

  it('preserves ZWJ-joined emoji sequences (ZWJ is not a combining mark)', () => {
    const familyEmoji = '👨‍👩‍👧';
    expect(limitCombiningMarks(familyEmoji)).toBe(familyEmoji);
  });
});

describe('sanitizeDisplayText', () => {
  it('strips bidi formatting controls', () => {
    const input = 'hello‎world‮test';
    expect(sanitizeDisplayText(input)).toBe('helloworldtest');
  });

  it('preserves ZWJ (not a bidi control)', () => {
    const input = '👨‍👩';
    expect(sanitizeDisplayText(input)).toBe(input);
  });

  it('limits combining marks and strips bidi controls together', () => {
    const input = 'a‎' + '́'.repeat(20) + 'b';
    expect(sanitizeDisplayText(input)).toBe('a' + '́'.repeat(4) + 'b');
  });

  it('returns empty input unchanged', () => {
    expect(sanitizeDisplayText('')).toBe('');
  });

  it('returns ordinary text unchanged', () => {
    expect(sanitizeDisplayText('Hello, world!')).toBe('Hello, world!');
  });
});
