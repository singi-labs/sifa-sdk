/**
 * The AppView injects a synthetic entry with this id into a claimed profile's
 * `activeApps` so external consumers of the public profile data (e.g.
 * atproto.nl/members reading `sifa.id/api/embed/<did>/data`) can show Sifa as
 * one of the platforms a person is on. Sifa's own `id.sifa.*` collections are
 * excluded from stream activity, so Sifa is otherwise absent from the list.
 *
 * First-party surfaces (sifa-web, sifa-app) hide it with {@link excludeSelfApp}:
 * on a Sifa page, "you're on Sifa" is redundant.
 */
export const SELF_APP_ID = 'sifa';

/**
 * Minimal structural shape of an app-in-list entry: just an `id`. Structurally
 * satisfied by the SDK's `ActiveApp`, but defined narrowly so this predicate
 * stays importable from the main entrypoint without pulling extra layers --
 * same discipline as {@link countRecentActivity}.
 */
export interface AppWithId {
  id: string;
}

/**
 * Drop the synthetic Sifa self-app ({@link SELF_APP_ID}) from an `activeApps`
 * list. Apply this in first-party UI that renders the list on a Sifa surface,
 * where showing Sifa is stating the obvious. Do NOT apply it in the data layer
 * that feeds external consumers (the public embed endpoint / SDK fetcher) --
 * those must keep the entry.
 *
 * Pure: returns a new array, preserves order, leaves inputs without a Sifa
 * entry unchanged.
 */
export function excludeSelfApp<T extends AppWithId>(apps: readonly T[]): T[] {
  return apps.filter((app) => app.id !== SELF_APP_ID);
}
