---
'@singi-labs/sifa-sdk': patch
---

Add rpg.actor to the app category map, activity tiers, and URL patterns. Character sprites (`actor.rpg.sprite`) and accepted equipment items (`equipment.rpg.item`) are now recognized activity and link to the player's rpg.actor page.

Add the `received` and `styledCharacter` stream verbs so an accepted rpg.actor item reads "Received {item}" and a character sprite reads "Styled a character".
