import { describe, expect, it } from 'vitest';
import { looksLikeDomain } from './domain-detect.js';

describe('looksLikeDomain', () => {
  it('recognizes bare and www domains', () => {
    expect(looksLikeDomain('randstad.com')).toBe(true);
    expect(looksLikeDomain('cxl.com')).toBe(true);
    expect(looksLikeDomain('www.stripe.com')).toBe(true);
    expect(looksLikeDomain('a.b.io')).toBe(true);
    expect(looksLikeDomain('example.co.uk')).toBe(true);
  });

  it('tolerates a scheme, path, and port', () => {
    expect(looksLikeDomain('https://www.stripe.com/pricing')).toBe(true);
    expect(looksLikeDomain('http://acme.com:8080/x')).toBe(true);
    expect(looksLikeDomain('RANDSTAD.COM')).toBe(true);
  });

  it('rejects plain company names and non-domain input', () => {
    expect(looksLikeDomain('Randstad')).toBe(false);
    expect(looksLikeDomain('Acme Corp')).toBe(false);
    expect(looksLikeDomain('')).toBe(false);
    expect(looksLikeDomain('   ')).toBe(false);
    expect(looksLikeDomain('foo bar.com')).toBe(false); // whitespace
  });

  it('rejects emails and numeric-only tails', () => {
    expect(looksLikeDomain('someone@acme.com')).toBe(false);
    expect(looksLikeDomain('3.5')).toBe(false); // TLD must be >=2 alpha
    expect(looksLikeDomain('v1.2')).toBe(false);
  });
});
