// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { type SifaApiConfig } from '../client.js';
import { SifaProvider } from '../config.js';
import { sifaQueryKeys } from '../keys.js';
import { useRpgClaimable } from './use-rpg-claimable.js';

function makeWrapper(fetchImpl: typeof fetch, config: SifaApiConfig) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: Infinity } },
  });
  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <SifaProvider config={{ ...config, fetch: fetchImpl }}>{children}</SifaProvider>
    </QueryClientProvider>
  );
  return { Wrapper, queryClient };
}

const baseConfig: SifaApiConfig = { baseUrl: 'https://api.example' };

afterEach(() => {
  vi.restoreAllMocks();
});

describe('useRpgClaimable', () => {
  it('reads /api/rpg/claimable and caches it under rpg.claimable()', async () => {
    const fetchImpl = vi.fn(() =>
      Promise.resolve(new Response(JSON.stringify({ count: 3 }), { status: 200 })),
    ) as unknown as typeof fetch;
    const { Wrapper, queryClient } = makeWrapper(fetchImpl, baseConfig);
    const { result } = renderHook(() => useRpgClaimable(), { wrapper: Wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual({ count: 3 });
    expect(queryClient.getQueryData(sifaQueryKeys.rpg.claimable())).toEqual({ count: 3 });
  });
});
