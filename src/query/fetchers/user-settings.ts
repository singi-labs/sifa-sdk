import { z } from 'zod';

import { apiFetch, type ApiFetchOptions, type SifaApiConfig } from '../client.js';

/**
 * The signed-in user's account preferences (`/api/settings`). Kept on the
 * AppView, not in a PDS record: they change how Sifa treats the account, not
 * what the account says about itself.
 */
export const UserSettingsSchema = z.object({
  respectBskyBlocks: z.boolean(),
  autoLinkCompanies: z.boolean(),
  /**
   * Show per-publication citation counts from OpenAlex on the profile.
   * Off by default; an API that predates the setting reads as off.
   */
  showCitationCounts: z.boolean().default(false),
});

export type UserSettings = z.infer<typeof UserSettingsSchema>;

/** Body accepted by {@link updateUserSettings}: only the preferences to change. */
export type UserSettingsPatch = Partial<UserSettings>;

export interface FetchUserSettingsOptions extends ApiFetchOptions {
  /** Session cookie to forward when reading from a server context. */
  cookieHeader?: string;
}

/** The caller's settings, or `null` when signed out or the read fails. */
export async function fetchUserSettings(
  config: SifaApiConfig,
  options: FetchUserSettingsOptions = {},
): Promise<UserSettings | null> {
  const { cookieHeader, ...rest } = options;
  const headers: Record<string, string> = { ...(rest.headers ?? {}) };
  if (cookieHeader) headers.cookie = cookieHeader;
  try {
    const data = await apiFetch<unknown>(config, '/api/settings', {
      cache: 'no-store',
      credentials: 'include',
      ...rest,
      headers,
    });
    const parsed = UserSettingsSchema.safeParse(data);
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

/** Save the given preferences. Returns the stored settings, or `null` on failure. */
export async function updateUserSettings(
  config: SifaApiConfig,
  patch: UserSettingsPatch,
): Promise<UserSettings | null> {
  try {
    const data = await apiFetch<unknown>(config, '/api/settings', {
      method: 'PATCH',
      credentials: 'include',
      body: patch,
    });
    const parsed = UserSettingsSchema.safeParse(data);
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}
