// Fetch the sifa.id item catalog from rpg.actor. Shared by
// scripts/check-rpg-catalog.mjs and scripts/sync-rpg-catalog.mjs.
// Throws an Error with an actionable message on any failure.
//
// The list endpoint does not include `channels`; those only come from the
// per-item endpoint (GET /api/creator/items/<id>, which also carries the
// images as data URLs). Each listed item without `channels` is filled from it.

export const RPG_ACTOR_ITEMS_ENDPOINT = 'https://rpg.actor/api/creator/items';

async function getJson(url, apiKey) {
  let res;
  try {
    res = await fetch(url, {
      headers: { Authorization: `Bearer ${apiKey}`, Accept: 'application/json' },
      signal: AbortSignal.timeout(30_000),
    });
  } catch (err) {
    throw new Error(
      `Request to ${url} failed (${err.message}). This may be a transient network error; re-run to confirm.`,
    );
  }
  if (res.status !== 200) {
    throw new Error(
      `${url} returned HTTP ${res.status}. A 401/403 means RPG_ACTOR_API_KEY is wrong or revoked; a 5xx may be transient, re-run to confirm.`,
    );
  }
  return res.json();
}

export async function fetchRpgActorCatalog(apiKey) {
  const endpoint = RPG_ACTOR_ITEMS_ENDPOINT;
  const body = await getJson(endpoint, apiKey);
  if (!body || typeof body.provider !== 'string' || !Array.isArray(body.items)) {
    throw new Error(
      `${endpoint} returned an unexpected shape (expected { provider, count, items[] }).`,
    );
  }
  for (const item of body.items) {
    if (item.channels !== undefined || typeof item.item !== 'string') continue;
    const detail = await getJson(`${endpoint}/${encodeURIComponent(item.item)}`, apiKey);
    if (Array.isArray(detail?.channels)) item.channels = detail.channels;
  }
  return body;
}
