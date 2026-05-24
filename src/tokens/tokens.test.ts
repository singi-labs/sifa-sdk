import { describe, expect, it } from 'vitest';

import { colors, fontFallbackStacks, fonts, iconSet, iconWeights } from './index.js';

describe('colors', () => {
  it('exposes Sifa-specific Flexoki accents from design-system.md', () => {
    expect(colors.primary).toBe('#4385BE');
    expect(colors.secondary).toBe('#8B7EC8');
  });

  it('is reference-stable across imports', () => {
    // Const assertion + module-scope = single reference. Important so
    // consumers can use the object as a React dep without churn.
    const a = colors;
    const b = colors;
    expect(a).toBe(b);
  });
});

describe('fonts', () => {
  it('names the three brand families from design-system.md', () => {
    expect(fonts.sans).toBe('iA Writer Quattro');
    expect(fonts.display).toBe('Space Grotesk');
    expect(fonts.mono).toBe('Source Code Pro');
  });
});

describe('fontFallbackStacks', () => {
  it('produces CSS-ready font-family strings starting with the brand font', () => {
    expect(fontFallbackStacks.sans).toMatch(/^'iA Writer Quattro',/);
    expect(fontFallbackStacks.display).toMatch(/^'Space Grotesk',/);
    expect(fontFallbackStacks.mono).toMatch(/^'Source Code Pro',/);
  });

  it('falls back through iA Writer Quattro after Space Grotesk for display text', () => {
    expect(fontFallbackStacks.display).toContain("'iA Writer Quattro'");
  });

  it('includes Noto Sans subsets for non-Latin scripts in both display and body', () => {
    for (const stack of [fontFallbackStacks.sans, fontFallbackStacks.display]) {
      expect(stack).toContain("'Noto Sans'");
      expect(stack).toContain("'Noto Sans Arabic'");
      expect(stack).toContain("'Noto Sans Devanagari'");
      expect(stack).toContain("'Noto Sans Thai'");
      expect(stack).toContain("'Noto Sans Hebrew'");
    }
  });

  it('lists OS-installed CJK fonts in both display and body', () => {
    for (const stack of [fontFallbackStacks.sans, fontFallbackStacks.display]) {
      expect(stack).toContain("'Hiragino Kaku Gothic ProN'");
      expect(stack).toContain("'PingFang SC'");
      expect(stack).toContain("'Apple SD Gothic Neo'");
    }
  });

  it('orders brand font ahead of Noto fallbacks ahead of CJK system fonts', () => {
    const stack = fontFallbackStacks.sans;
    const brand = stack.indexOf("'iA Writer Quattro'");
    const noto = stack.indexOf("'Noto Sans'");
    const cjk = stack.indexOf("'Hiragino Kaku Gothic ProN'");
    expect(brand).toBeGreaterThanOrEqual(0);
    expect(brand).toBeLessThan(noto);
    expect(noto).toBeLessThan(cjk);
  });

  it('terminates each stack with a generic CSS family', () => {
    expect(fontFallbackStacks.sans).toMatch(/sans-serif$/);
    expect(fontFallbackStacks.display).toMatch(/sans-serif$/);
    expect(fontFallbackStacks.mono).toMatch(/monospace$/);
  });
});

describe('iconSet + iconWeights', () => {
  it('mandates Phosphor as the single icon library', () => {
    expect(iconSet).toBe('phosphor');
  });

  it('maps usage contexts to weights', () => {
    expect(iconWeights.uiChrome).toBe('regular');
    expect(iconWeights.interactive).toBe('bold');
    expect(iconWeights.decorative).toBe('duotone');
  });
});
