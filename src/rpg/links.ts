/** Base URL of rpg.actor. */
export const RPG_ACTOR_URL = 'https://rpg.actor';

/**
 * Record key of the `equipment.rpg.give` Sifa writes for an item. rpg.actor
 * stores the accepted `equipment.rpg.item` under the same key, so this also
 * identifies the item in the player's own account.
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
