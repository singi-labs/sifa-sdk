/**
 * App-category taxonomy for AT Protocol apps tracked by Sifa.
 *
 * Categories group apps by what kind of activity they produce (Posts, Photos,
 * Code, ...). They drive the pill-size icon shown in `<AppPill>` and the
 * fallback glyph used in activity-card headers when no app-specific logo
 * exists.
 *
 * This file is intentionally data-only -- icon mapping is renderer-specific
 * (React DOM Phosphor components on web, React Native components on mobile)
 * and lives in the consumer. The `phosphorIcon` field is the Phosphor icon
 * NAME, not a component reference.
 *
 * Categories are an internal grouping; we do not surface this taxonomy in
 * public-facing copy.
 */

export const APP_CATEGORIES = {
  Articles: { phosphorIcon: 'Article' },
  Chat: { phosphorIcon: 'ChatsCircle' },
  Code: { phosphorIcon: 'Code' },
  Domains: { phosphorIcon: 'Globe' },
  Endorsements: { phosphorIcon: 'HandHeart' },
  Events: { phosphorIcon: 'CalendarBlank' },
  Impact: { phosphorIcon: 'Certificate' },
  Links: { phosphorIcon: 'LinkSimple' },
  Lists: { phosphorIcon: 'ListBullets' },
  Music: { phosphorIcon: 'MusicNote' },
  Pages: { phosphorIcon: 'Browser' },
  Pastes: { phosphorIcon: 'Clipboard' },
  Photos: { phosphorIcon: 'Camera' },
  Places: { phosphorIcon: 'MapPin' },
  Posts: { phosphorIcon: 'ChatCircle' },
  'Q&A': { phosphorIcon: 'Question' },
  Recipes: { phosphorIcon: 'CookingPot' },
  Research: { phosphorIcon: 'Path' },
  Reviews: { phosphorIcon: 'Star' },
  Slides: { phosphorIcon: 'Presentation' },
  Social: { phosphorIcon: 'UsersThree' },
  Translations: { phosphorIcon: 'Translate' },
  Verification: { phosphorIcon: 'Key' },
  Video: { phosphorIcon: 'VideoCamera' },
} as const;

export type AppCategoryId = keyof typeof APP_CATEGORIES;

export const APP_CATEGORY_IDS = Object.keys(APP_CATEGORIES) as AppCategoryId[];

export function isAppCategory(value: string): value is AppCategoryId {
  return Object.prototype.hasOwnProperty.call(APP_CATEGORIES, value);
}

export function getAppCategoryIcon(category: AppCategoryId): string {
  return APP_CATEGORIES[category].phosphorIcon;
}
