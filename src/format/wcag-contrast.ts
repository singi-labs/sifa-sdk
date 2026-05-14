/**
 * WCAG 2.2 contrast ratio utilities for validating publication theme colors.
 * Implements the relative luminance and contrast ratio formulas from
 * https://www.w3.org/TR/WCAG22/#dfn-relative-luminance
 */

export interface RgbColor {
  r: number;
  g: number;
  b: number;
}

/**
 * Return true when the value is an RgbColor with all channels as integers in [0, 255].
 * Use this before passing untrusted data to the luminance / contrast functions.
 */
export function isValidRgbColor(value: unknown): value is RgbColor {
  if (value == null || typeof value !== 'object') return false;
  const { r, g, b } = value as Record<string, unknown>;
  return (
    typeof r === 'number' &&
    typeof g === 'number' &&
    typeof b === 'number' &&
    Number.isFinite(r) &&
    Number.isFinite(g) &&
    Number.isFinite(b) &&
    r >= 0 &&
    r <= 255 &&
    g >= 0 &&
    g <= 255 &&
    b >= 0 &&
    b <= 255
  );
}

/**
 * Serialize an RgbColor to a CSS `rgb(...)` string.
 * Channels are floored to integers to prevent sub-pixel drift.
 */
export function rgbToString(color: RgbColor): string {
  return `rgb(${Math.floor(color.r)}, ${Math.floor(color.g)}, ${Math.floor(color.b)})`;
}

/**
 * Calculate relative luminance of an sRGB color per WCAG 2.2.
 * Input channels must be numbers in [0, 255].
 */
export function relativeLuminance(color: RgbColor): number {
  const [rs, gs, bs] = [color.r / 255, color.g / 255, color.b / 255];

  const r = rs <= 0.04045 ? rs / 12.92 : Math.pow((rs + 0.055) / 1.055, 2.4);
  const g = gs <= 0.04045 ? gs / 12.92 : Math.pow((gs + 0.055) / 1.055, 2.4);
  const b = bs <= 0.04045 ? bs / 12.92 : Math.pow((bs + 0.055) / 1.055, 2.4);

  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/**
 * Calculate WCAG 2.2 contrast ratio between two colors.
 * Returns a value between 1 (identical) and 21 (black/white).
 */
export function contrastRatio(color1: RgbColor, color2: RgbColor): number {
  const l1 = relativeLuminance(color1);
  const l2 = relativeLuminance(color2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Check if two colors meet WCAG 2.2 AA contrast requirement (4.5:1 for normal text).
 */
export function meetsContrastAA(foreground: RgbColor, background: RgbColor): boolean {
  return contrastRatio(foreground, background) >= 4.5;
}
