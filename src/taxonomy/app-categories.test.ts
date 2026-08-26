import { describe, expect, it } from 'vitest';

import {
  APP_CATEGORIES,
  APP_CATEGORY_IDS,
  getAppCategoryIcon,
  isAppCategory,
} from './app-categories.js';
import { APP_CATEGORY_MAP, categoryForApp, isKnownAppId } from './app-category-map.js';

describe('APP_CATEGORIES', () => {
  it('has a phosphorIcon for every category', () => {
    for (const id of APP_CATEGORY_IDS) {
      expect(APP_CATEGORIES[id].phosphorIcon).toMatch(/^[A-Z][A-Za-z]+$/);
    }
  });

  it('phosphorIcon names are unique per category', () => {
    const icons = APP_CATEGORY_IDS.map((id) => APP_CATEGORIES[id].phosphorIcon);
    expect(new Set(icons).size).toBe(icons.length);
  });

  it('isAppCategory accepts known ids and rejects unknown', () => {
    expect(isAppCategory('Articles')).toBe(true);
    expect(isAppCategory('Verification')).toBe(true);
    expect(isAppCategory('articles')).toBe(false);
    expect(isAppCategory('Unknown')).toBe(false);
    expect(isAppCategory('toString')).toBe(false);
    expect(isAppCategory('constructor')).toBe(false);
  });

  it('getAppCategoryIcon returns the configured icon name', () => {
    expect(getAppCategoryIcon('Posts')).toBe('ChatCircle');
    expect(getAppCategoryIcon('Chat')).toBe('ChatsCircle');
    expect(getAppCategoryIcon('Research')).toBe('Path');
    expect(getAppCategoryIcon('Music')).toBe('MusicNote');
    expect(getAppCategoryIcon('Q&A')).toBe('Question');
    expect(getAppCategoryIcon('Domains')).toBe('Globe');
    expect(getAppCategoryIcon('Translations')).toBe('Translate');
  });
});

describe('APP_CATEGORY_MAP', () => {
  it('every value is a valid category id', () => {
    for (const [appId, categoryId] of Object.entries(APP_CATEGORY_MAP)) {
      expect(isAppCategory(categoryId), `${appId} -> ${categoryId}`).toBe(true);
    }
  });

  it('categoryForApp resolves known apps', () => {
    expect(categoryForApp('bluesky')).toBe('Posts');
    expect(categoryForApp('semble')).toBe('Research');
    expect(categoryForApp('keytrace')).toBe('Verification');
    expect(categoryForApp('beaconbits')).toBe('Places');
    expect(categoryForApp('passports')).toBe('Places');
    expect(categoryForApp('asq')).toBe('Q&A');
    expect(categoryForApp('plyr')).toBe('Music');
    expect(categoryForApp('pixl')).toBe('Photos');
    expect(categoryForApp('spark')).toBe('Posts');
    expect(categoryForApp('nooki')).toBe('Social');
    expect(categoryForApp('atmobb')).toBe('Social');
    expect(categoryForApp('chive')).toBe('Research');
    expect(categoryForApp('zeens')).toBe('Photos');
    expect(categoryForApp('atstore')).toBe('Reviews');
    expect(categoryForApp('atfund')).toBe('Endorsements');
    expect(categoryForApp('crate')).toBe('Articles');
    expect(categoryForApp('dropanchor')).toBe('Places');
    expect(categoryForApp('atmorsvp')).toBe('Events');
    expect(categoryForApp('opensocial')).toBe('Social');
    expect(categoryForApp('kevara')).toBe('Events');
    expect(categoryForApp('marque')).toBe('Domains');
    expect(categoryForApp('atcr')).toBe('Code');
    expect(categoryForApp('mcp')).toBe('Code');
    expect(categoryForApp('waow')).toBe('Photos');
    expect(categoryForApp('lichen')).toBe('Pages');
    expect(categoryForApp('badges')).toBe('Verification');
    expect(categoryForApp('atvouch')).toBe('Endorsements');
    expect(categoryForApp('plonk')).toBe('Pastes');
    expect(categoryForApp('kich')).toBe('Recipes');
    expect(categoryForApp('aetherdocs')).toBe('Slides');
    expect(categoryForApp('margin')).toBe('Research');
    expect(categoryForApp('recipe')).toBe('Recipes');
    expect(categoryForApp('guestbook')).toBe('Social');
    expect(categoryForApp('fediverse')).toBe('Posts');
    expect(categoryForApp('locale')).toBe('Translations');
    expect(categoryForApp('pckt')).toBe('Posts');
  });

  it('categoryForApp returns undefined for unknown apps', () => {
    expect(categoryForApp('does-not-exist')).toBeUndefined();
  });

  it('isKnownAppId narrows the type', () => {
    expect(isKnownAppId('bluesky')).toBe(true);
    expect(isKnownAppId('nope')).toBe(false);
    expect(isKnownAppId('toString')).toBe(false);
    expect(isKnownAppId('constructor')).toBe(false);
  });

  it('categoryForApp returns undefined for inherited prototype keys', () => {
    expect(categoryForApp('toString')).toBeUndefined();
    expect(categoryForApp('hasOwnProperty')).toBeUndefined();
  });
});
