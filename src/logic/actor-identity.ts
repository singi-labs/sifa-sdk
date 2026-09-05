/**
 * Whether a person named on someone else's record may render with their
 * identity attached -- display name, avatar, and a link to their profile.
 *
 * Naming someone is a claim. The default is that an unconfirmed claim shows as
 * a bare handle: it does not get to borrow that person's face until they affirm
 * it with an `id.sifa.confirmation`. This predicate widens that default in one
 * case: a person with a *claimed* Sifa account (`claimed`) is shown by name and
 * linked even before they confirm, because they can be notified of the pending
 * claim and act on it from their own account. An indexed-but-unclaimed account
 * cannot be notified, so it stays a bare handle until confirmed.
 *
 * The AppView is still the enforcement point: it only serves `displayName` /
 * `avatar` for a card when this predicate would hold, so a consumer that
 * forgets the rule cannot leak the identity. This predicate exists so web, the
 * activity surfaces, and any future consumer decide it identically.
 */
export function actorShowsIdentity(actor: { confirmed?: boolean; claimed?: boolean }): boolean {
  return !!(actor.confirmed || actor.claimed);
}
