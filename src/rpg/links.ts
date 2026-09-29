/** Base URL of rpg.actor. */
export const RPG_ACTOR_URL = 'https://rpg.actor';

/**
 * Record key of the `equipment.rpg.give` Sifa writes for an item. rpg.actor
 * stores the accepted `equipment.rpg.item` under the same key, so this also
 * identifies the item in the player's own account.
 *
 * The DID is used as-is: AT Protocol record keys allow `A-Za-z0-9 . - _ : ~`
 * (https://atproto.com/specs/record-key), so the colons in `did:plc:` are
 * valid. The format is already live in written gift records; do not change it.
 */
export function rpgGiveRkey(itemId: string, recipientDid: string): string {
  return `sifa-${itemId}-${recipientDid}`;
}

/** The player's character page on rpg.actor, where pending gifts can be accepted. */
export function rpgActorCharacterUrl(handleOrDid: string): string {
  return `${RPG_ACTOR_URL}/${encodeURIComponent(handleOrDid.replace(/^@+/, ''))}`;
}

/** Deep link that opens the Wear action for an accepted Sifa item on the character page. */
export function rpgActorWearUrl(handleOrDid: string, itemId: string, recipientDid: string): string {
  return `${rpgActorCharacterUrl(handleOrDid)}?wear=${encodeURIComponent(rpgGiveRkey(itemId, recipientDid))}`;
}
