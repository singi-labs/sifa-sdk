// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { type SifaApiConfig } from '../client.js';
import { SifaProvider } from '../config.js';
import { sifaQueryKeys } from '../keys.js';
import { useUpdateUserSettings, useUserSettings } from './use-user-settings.js';

function jsonFetch(body: unknown, status = 200) {
  return vi.fn((_input: RequestInfo | URL, _init?: RequestInit) =>
    Promise.resolve(new Response(JSON.stringify(body), { status })),
  );
}

function makeWrapper(fetchImpl: ReturnType<typeof jsonFetch>) {
  const config: SifaApiConfig = { baseUrl: 'https://api.example', fetch: fetchImpl };
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: Infinity } },
  });
  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <SifaProvider config={config}>{children}</SifaProvider>
    </QueryClientProvider>
  );
  return { Wrapper, queryClient };
}

const SAVED = { respectBskyBlocks: true, autoLinkCompanies: true, showCitationCounts: true };

describe('user settings hooks', () => {
  it('useUserSettings reads the settings under the userSettings key', async () => {
    const { Wrapper } = makeWrapper(jsonFetch(SAVED));
    const { result } = renderHook(() => useUserSettings(), { wrapper: Wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(SAVED);
  });

  it('useUpdateUserSettings writes the saved settings into the cache', async () => {
    const { Wrapper, queryClient } = makeWrapper(jsonFetch(SAVED));
    const { result } = renderHook(() => useUpdateUserSettings(), { wrapper: Wrapper });
    await act(async () => {
      await result.current.mutateAsync({ showCitationCounts: true });
    });
    expect(queryClient.getQueryData(sifaQueryKeys.userSettings.all())).toEqual(SAVED);
  });
});
