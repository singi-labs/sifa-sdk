// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { type SifaApiConfig } from '../client.js';
import { SifaProvider } from '../config.js';
import { sifaQueryKeys } from '../keys.js';
import { useRpgStatus } from './use-rpg-status.js';

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
const STATUS = { hasCharacter: true, canWriteItems: false, canCollect: false, items: [] };

afterEach(() => {
  vi.restoreAllMocks();
});

describe('useRpgStatus', () => {
  it('reads /api/rpg/status and caches it under rpg.status()', async () => {
    const fetchImpl = vi.fn(() =>
      Promise.resolve(new Response(JSON.stringify(STATUS), { status: 200 })),
    ) as unknown as typeof fetch;
    const { Wrapper, queryClient } = makeWrapper(fetchImpl, baseConfig);
    const { result } = renderHook(() => useRpgStatus(), { wrapper: Wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.hasCharacter).toBe(true);
    expect(queryClient.getQueryData(sifaQueryKeys.rpg.status())).toMatchObject(STATUS);
    const calledUrl = String((fetchImpl as unknown as ReturnType<typeof vi.fn>).mock.calls[0]?.[0]);
    expect(calledUrl).toBe('https://api.example/api/rpg/status');
  });

  it('does not fetch while disabled', () => {
    const fetchImpl = vi.fn() as unknown as typeof fetch;
    const { Wrapper } = makeWrapper(fetchImpl, baseConfig);
    renderHook(() => useRpgStatus({ enabled: false }), { wrapper: Wrapper });
    expect(fetchImpl).not.toHaveBeenCalled();
  });
});
