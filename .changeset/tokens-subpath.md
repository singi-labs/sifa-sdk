---
'@singi-labs/sifa-sdk': patch
---

Add `@singi-labs/sifa-sdk/tokens` subpath -- Sifa brand design tokens encoded from `Singi Labs/brand/design-system.md`.

### Why

Phase 6.3 of the SDK extraction plan (revised 2026-05-16). Captures the design-system spec values as TS constants so the planned `sifa-app` (React Native) can consume the same brand foundations without forking. `sifa-web` already implements these in `globals.css`; Phase 6.4 will refactor it to source the strings from this module where Tailwind-4's CSS-first config permits.

### Exports

```ts
import { colors, fonts, fontFallbackStacks, iconSet, iconWeights } from '@singi-labs/sifa-sdk/tokens';

colors.primary             // '#4385BE'  Flexoki Blue (Sifa accent)
colors.secondary           // '#8B7EC8'  Flexoki Purple (shared)
fonts.sans                 // 'iA Writer Quattro'
fonts.display              // 'Space Grotesk'
fonts.mono                 // 'Source Code Pro'
fontFallbackStacks.sans    // "'iA Writer Quattro', -apple-system, ..."
fontFallbackStacks.display // "'Space Grotesk', 'iA Writer Quattro', system-ui, sans-serif"
fontFallbackStacks.mono    // "'Source Code Pro', ui-monospace, ..."
iconSet                    // 'phosphor'
iconWeights.uiChrome       // 'regular'
iconWeights.interactive    // 'bold'
iconWeights.decorative     // 'duotone'
```

### What's intentionally NOT in this module

- **Neutral color scales** (background, surface, border, text). These come from Radix Colors at runtime via CSS variables; encoding them as TS constants would misrepresent how they're consumed.
- **Spacing / breakpoint scales.** sifa-web uses Tailwind's defaults; no Sifa-specific scale exists yet. Add later if needed.
- **CSS variable strings, Style Dictionary output, design-token JSON formats.** Decision baked in (2026-05-14, reaffirmed 2026-05-16): TS constants only. Consumers translate to their own format.

### Versioning

Patch bump -- purely additive, no API changes elsewhere. (Per pre-1.0 convention: patches for additive changes; reserve minors for substantial milestones like closing out a whole phase.)
