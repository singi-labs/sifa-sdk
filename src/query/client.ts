/**
 * Foundation HTTP client for talking to the Sifa AppView.
 *
 * Stateless. Consumers supply a {@link SifaApiConfig} per call (the React
 * hooks read it from context; non-React consumers pass it explicitly). No
 * singletons, no module-level state.
 */

/** Configuration passed to every fetcher. */
export interface SifaApiConfig {
  /** Base URL of the sifa-api AppView, e.g. `https://api.sifa.id`. No trailing slash. */
  baseUrl: string;
  /**
   * Optional fetch implementation. Defaults to {@link globalThis.fetch}.
   * Lets Next.js consumers pass their cache-enhanced fetch; node/Expo
   * consumers can leave this unset.
   */
  fetch?: typeof fetch;
}

/** Options accepted by {@link apiFetch}. */
export interface ApiFetchOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  /** Request body. Serialized to JSON automatically. */
  body?: unknown;
  /** AbortSignal. Defaults to `AbortSignal.timeout(timeoutMs)` if `timeoutMs` is set. */
  signal?: AbortSignal;
  /** Per-call timeout in milliseconds. Default: 10_000. Ignored if `signal` is provided. */
  timeoutMs?: number;
  /** Retry on HTTP 429 up to 3 times with the server's `Retry-After` delay (capped at 3s). */
  retryOn429?: boolean;
  /** Additional headers. `Content-Type: application/json` is set automatically when `body` is present. */
  headers?: Record<string, string>;
  credentials?: RequestCredentials;
  cache?: RequestCache;
  /**
   * Next.js-specific cache hints. Ignored on non-Next runtimes. Passed
   * through transparently as part of {@link RequestInit}.
   */
  next?: { revalidate?: number | false; tags?: string[] };
}

/** Error thrown by {@link apiFetch} on non-2xx responses. */
export class ApiError extends Error {
  readonly status: number;
  readonly body: unknown;

  constructor(message: string, status: number, body?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.body = body;
  }
}

const DEFAULT_TIMEOUT_MS = 10_000;
const MAX_RATE_LIMIT_RETRIES = 3;
const RATE_LIMIT_RETRY_CAP_SECONDS = 3;

/**
 * Generic fetcher used by all SDK query and mutation functions.
 *
 * Returns parsed JSON typed as `T`. Throws {@link ApiError} on non-2xx
 * responses. Use {@link apiFetchOrNull} when 404 should resolve to `null`
 * instead.
 */
export async function apiFetch<T = unknown>(
  config: SifaApiConfig,
  path: string,
  options: ApiFetchOptions = {},
): Promise<T> {
  const fetchFn = config.fetch ?? globalThis.fetch;
  const url = `${config.baseUrl}${path}`;
  const maxRetries = options.retryOn429 ? MAX_RATE_LIMIT_RETRIES : 0;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const signal = options.signal ?? AbortSignal.timeout(options.timeoutMs ?? DEFAULT_TIMEOUT_MS);

    const headers: Record<string, string> = { ...(options.headers ?? {}) };
    let body: BodyInit | undefined;
    if (options.body !== undefined) {
      headers['Content-Type'] ??= 'application/json';
      body = JSON.stringify(options.body);
    }

    // `next` is a Next.js extension to RequestInit; cast through.
    const init = {
      method: options.method ?? 'GET',
      headers,
      body,
      signal,
      credentials: options.credentials,
      cache: options.cache,
      ...(options.next ? { next: options.next } : {}),
    } as RequestInit;

    const res = await fetchFn(url, init);

    if (res.status === 429 && attempt < maxRetries) {
      const retryAfterRaw = res.headers.get('retry-after');
      const retryAfter = retryAfterRaw ? Number.parseInt(retryAfterRaw, 10) : 2;
      const waitSeconds = Math.min(
        Number.isFinite(retryAfter) ? retryAfter : 2,
        RATE_LIMIT_RETRY_CAP_SECONDS,
      );
      await new Promise((r) => setTimeout(r, waitSeconds * 1000));
      continue;
    }

    if (!res.ok) {
      let errBody: unknown;
      try {
        errBody = (await res.json()) as unknown;
      } catch {
        try {
          errBody = await res.text();
        } catch {
          errBody = undefined;
        }
      }
      throw new ApiError(`Sifa API ${res.status} on ${path}`, res.status, errBody);
    }

    return (await res.json()) as T;
  }

  throw new ApiError(`Sifa API exhausted retries on ${path}`, 429);
}

/**
 * Variant of {@link apiFetch} that resolves to `null` on HTTP 404 instead
 * of throwing. Useful for "fetch by handle" reads where missing is
 * expected (e.g. unknown profile).
 */
export async function apiFetchOrNull<T>(
  config: SifaApiConfig,
  path: string,
  options: ApiFetchOptions = {},
): Promise<T | null> {
  try {
    return await apiFetch<T>(config, path, options);
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) return null;
    throw e;
  }
}
