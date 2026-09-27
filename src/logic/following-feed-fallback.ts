/**
 * The app to show when the default following feed comes back empty, or null.
 *
 * The default feed leaves Bluesky out, so a network that is quiet elsewhere
 * gets an empty page even when it is active on some app. Rather than show an
 * empty state, a client switches to the busiest app the network is active on.
 * Shared by sifa-web and sifa-app so both behave the same.
 */
export function followingFeedFallbackApp(
  feed: {
    items: readonly unknown[];
    apps?: readonly { id: string; count: number }[];
  } | null,
): string | null {
  if (!feed || feed.items.length > 0 || !feed.apps?.length) return null;
  let busiest = feed.apps[0]!;
  for (const app of feed.apps) if (app.count > busiest.count) busiest = app;
  return busiest.id;
}
