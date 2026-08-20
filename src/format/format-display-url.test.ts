import { describe, expect, it } from 'vitest';

import { formatDisplayUrl } from './format-display-url.js';

describe('formatDisplayUrl', () => {
  describe('display normalization', () => {
    it('strips the scheme and a leading www for display', () => {
      expect(formatDisplayUrl('https://www.example.com').display).toBe('example.com');
    });

    it('keeps the full, navigable URL in href (scheme + www preserved)', () => {
      expect(formatDisplayUrl('https://www.example.com').href).toBe('https://www.example.com/');
    });

    it('drops a trailing slash', () => {
      expect(formatDisplayUrl('http://meet-magento.nl/').display).toBe('meet-magento.nl');
    });

    it('drops query and hash from the display', () => {
      expect(formatDisplayUrl('https://x.com/a?b=1#c', { path: 'full' }).display).toBe('x.com/a');
    });

    it('keeps query and hash in href (the real destination)', () => {
      expect(formatDisplayUrl('https://x.com/a?b=1#c').href).toBe('https://x.com/a?b=1#c');
    });

    it('drops UTM cruft from the display', () => {
      expect(
        formatDisplayUrl('http://meet-magento.nl/?utm_source=test&', { path: 'firstSegment' })
          .display,
      ).toBe('meet-magento.nl');
    });
  });

  describe('scheme-less input', () => {
    it('shows the host without inventing a scheme in the display', () => {
      expect(formatDisplayUrl('meet-magento.nl').display).toBe('meet-magento.nl');
    });

    it('prepends https:// so href is navigable', () => {
      expect(formatDisplayUrl('meet-magento.nl').href).toBe('https://meet-magento.nl/');
    });
  });

  describe('path policy', () => {
    it('firstSegment keeps only the first path segment', () => {
      expect(formatDisplayUrl('https://gui.do/events/', { path: 'firstSegment' }).display).toBe(
        'gui.do/events',
      );
    });

    it('firstSegment collapses a deep path to host + first segment', () => {
      expect(
        formatDisplayUrl(
          'https://shoppingtomorrow.nl/nl/themas/marketing/conversion/conversion-optimization-2021',
          { path: 'firstSegment' },
        ).display,
      ).toBe('shoppingtomorrow.nl/nl');
    });

    it('full keeps the whole pathname (account identity, e.g. github.com/user/repo)', () => {
      expect(formatDisplayUrl('https://github.com/user/repo', { path: 'full' }).display).toBe(
        'github.com/user/repo',
      );
    });

    it('none keeps host only', () => {
      expect(formatDisplayUrl('https://gui.do/events/deep', { path: 'none' }).display).toBe(
        'gui.do',
      );
    });

    it("defaults to 'full' when no path policy is given", () => {
      expect(formatDisplayUrl('https://github.com/user/repo').display).toBe('github.com/user/repo');
    });
  });

  describe('non-web schemes and fallbacks', () => {
    it('strips a dns: prefix (atproto handle refs)', () => {
      const r = formatDisplayUrl('dns:gui.do');
      expect(r.display).toBe('gui.do');
      expect(r.href).toBe('dns:gui.do');
    });

    it('returns empty for empty input', () => {
      expect(formatDisplayUrl('')).toEqual({ display: '', href: '' });
      expect(formatDisplayUrl('   ')).toEqual({ display: '', href: '' });
    });

    it('never throws on garbage input', () => {
      expect(() => formatDisplayUrl('::::')).not.toThrow();
      expect(() => formatDisplayUrl('http://')).not.toThrow();
    });

    it('trims surrounding whitespace', () => {
      expect(formatDisplayUrl('  https://example.com/a  ', { path: 'full' }).display).toBe(
        'example.com/a',
      );
    });
  });
});
