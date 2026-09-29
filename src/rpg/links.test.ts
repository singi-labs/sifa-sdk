import { describe, expect, it } from 'vitest';

import { rpgActorCharacterUrl, rpgActorWearUrl, rpgGiveRkey } from './links.js';

describe('rpg.actor links', () => {
  it('builds the give record key from item id and recipient DID', () => {
    expect(rpgGiveRkey('sifa_power_suit', 'did:plc:abc')).toBe('sifa-sifa_power_suit-did:plc:abc');
  });
  it('links to the character page by handle, stripping a leading @', () => {
    expect(rpgActorCharacterUrl('@gui.do')).toBe('https://rpg.actor/gui.do');
  });
  it('deep-links the Wear action with the encoded record key', () => {
    expect(rpgActorWearUrl('gui.do', 'sifa_power_suit', 'did:plc:abc')).toBe(
      'https://rpg.actor/gui.do?wear=sifa-sifa_power_suit-did%3Aplc%3Aabc',
    );
  });
});
