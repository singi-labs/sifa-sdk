'use client';

import { createContext, useContext, type ReactNode } from 'react';

import type { SifaApiConfig } from './client.js';

const SifaConfigContext = createContext<SifaApiConfig | null>(null);

export interface SifaProviderProps {
  config: SifaApiConfig;
  children: ReactNode;
}

/**
 * Provides the {@link SifaApiConfig} that hooks under it can read via
 * {@link useSifaConfig}. Wrap the React tree once; hooks consume it.
 *
 * @example
 * ```tsx
 * <QueryClientProvider client={queryClient}>
 *   <SifaProvider config={{ baseUrl: process.env.NEXT_PUBLIC_API_URL! }}>
 *     <App />
 *   </SifaProvider>
 * </QueryClientProvider>
 * ```
 */
export function SifaProvider({ config, children }: SifaProviderProps) {
  return <SifaConfigContext.Provider value={config}>{children}</SifaConfigContext.Provider>;
}

/**
 * Read the SDK's {@link SifaApiConfig} from context. Throws if no
 * {@link SifaProvider} is mounted above.
 */
export function useSifaConfig(): SifaApiConfig {
  const ctx = useContext(SifaConfigContext);
  if (!ctx) {
    throw new Error(
      'useSifaConfig must be used inside <SifaProvider>. Wrap your app once with <SifaProvider config={...}>.',
    );
  }
  return ctx;
}
