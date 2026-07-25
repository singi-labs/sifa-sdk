// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook } from '@testing-library/react';
import * as React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { type SifaApiConfig } from '../client.js';
import { SifaProvider } from '../config.js';
import { sifaQueryKeys } from '../keys.js';
import { useUpdateSkillSubCategories } from './use-skill-mutations.js';

function makeWrapper(fetchImpl: typeof fetch) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  });
  const config: SifaApiConfig = { baseUrl: 'https://api.example', fetch: fetchImpl };
  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <SifaProvider config={config}>{children}</SifaProvider>
    </QueryClientProvider>
  );
  return { Wrapper, queryClient };
}

function jsonFetch(body: unknown, status = 200): typeof fetch {
  return vi.fn(() => Promise.resolve(new Response(JSON.stringify(body), { status })));
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('useUpdateSkillSubCategories (#324)', () => {
  it('invalidates the owner profile query on success', async () => {
    const fetchImpl = jsonFetch({ ok: true, updated: 2, unchanged: 0, skipped: [] });
    const { Wrapper, queryClient } = makeWrapper(fetchImpl);
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useUpdateSkillSubCategories('alice.example'), {
      wrapper: Wrapper,
    });

    await act(async () => {
      const r = await result.current.mutateAsync({ rkeys: ['a', 'b'], subCategory: 'Frontend' });
      expect(r.success).toBe(true);
      expect(r.updated).toBe(2);
    });

    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: sifaQueryKeys.profile.byHandle('alice.example'),
    });
  });

  it('still invalidates when the caller supplies its own onSuccess', async () => {
    const fetchImpl = jsonFetch({ ok: true, updated: 1, unchanged: 0, skipped: [] });
    const { Wrapper, queryClient } = makeWrapper(fetchImpl);
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');
    const onSuccess = vi.fn();

    const { result } = renderHook(
      () => useUpdateSkillSubCategories('alice.example', { onSuccess }),
      { wrapper: Wrapper },
    );

    await act(async () => {
      await result.current.mutateAsync({ rkeys: ['a'], subCategory: 'Frontend' });
    });

    expect(onSuccess).toHaveBeenCalled();
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: sifaQueryKeys.profile.byHandle('alice.example'),
    });
  });

  it('does not invalidate when the write fails', async () => {
    const fetchImpl = jsonFetch({ message: 'Rate limit exceeded' }, 429);
    const { Wrapper, queryClient } = makeWrapper(fetchImpl);
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useUpdateSkillSubCategories('alice.example'), {
      wrapper: Wrapper,
    });

    await act(async () => {
      const r = await result.current.mutateAsync({ rkeys: ['a'], subCategory: 'Frontend' });
      expect(r.success).toBe(false);
    });

    expect(invalidateSpy).not.toHaveBeenCalled();
  });
});
