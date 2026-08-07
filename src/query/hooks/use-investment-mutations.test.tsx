// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import type { ReactNode } from 'react';

const { mockCreateInvestment } = vi.hoisted(() => ({
  mockCreateInvestment: vi.fn(),
}));

vi.mock('../fetchers/investments.js', () => ({
  createInvestment: mockCreateInvestment,
  updateInvestment: vi.fn(),
  deleteInvestment: vi.fn(),
}));

vi.mock('../config.js', () => ({
  useSifaConfig: () => ({ apiUrl: 'https://example.test' }),
}));

import { useCreateInvestment } from './use-investment-mutations.js';

function wrapper(client: QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  };
}

describe('useCreateInvestment cache invalidation', () => {
  beforeEach(() => {
    mockCreateInvestment.mockReset();
    mockCreateInvestment.mockResolvedValue({ success: true, rkey: '3abc' });
  });

  it('invalidates the owner profile on success', async () => {
    const client = new QueryClient();
    const spy = vi.spyOn(client, 'invalidateQueries');
    const { result } = renderHook(() => useCreateInvestment('did:plc:owner'), {
      wrapper: wrapper(client),
    });

    await result.current.mutateAsync({ company: 'ShopAgentic' });

    await waitFor(() => expect(spy).toHaveBeenCalled());
  });

  // Object spread order decides this. With `...options` spread last, a consumer's
  // onSuccess replaces the internal handler outright and invalidation silently stops
  // happening -- stale data with no error anywhere.
  it('still invalidates when the consumer supplies its own onSuccess', async () => {
    const client = new QueryClient();
    const spy = vi.spyOn(client, 'invalidateQueries');
    const consumerOnSuccess = vi.fn();

    const { result } = renderHook(
      () => useCreateInvestment('did:plc:owner', { onSuccess: consumerOnSuccess }),
      { wrapper: wrapper(client) },
    );

    await result.current.mutateAsync({ company: 'ShopAgentic' });

    await waitFor(() => expect(spy).toHaveBeenCalled());
    expect(consumerOnSuccess).toHaveBeenCalled();
  });

  it('does not invalidate when the write fails', async () => {
    mockCreateInvestment.mockResolvedValue({ success: false, error: 'nope' });
    const client = new QueryClient();
    const spy = vi.spyOn(client, 'invalidateQueries');

    const { result } = renderHook(() => useCreateInvestment('did:plc:owner'), {
      wrapper: wrapper(client),
    });

    await result.current.mutateAsync({ company: 'ShopAgentic' });

    expect(spy).not.toHaveBeenCalled();
  });
});
