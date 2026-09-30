'use client';

import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationOptions,
  type UseQueryOptions,
} from '@tanstack/react-query';

import { type WriteResult } from '../client.js';
import { useSifaConfig } from '../config.js';
import {
  createOrgAttestation,
  fetchAttestationRequests,
  fetchOrgAttestations,
  offboardOrgAttestation,
  rejectAttestationRequest,
  requestEmploymentConfirmation,
  revokeOrgAttestation,
  type AttestationRequest,
  type CreateOrgAttestationInput,
  type CreateOrgAttestationResult,
  type OrgAttestation,
  type RequestEmploymentConfirmationInput,
  type RequestEmploymentConfirmationResult,
} from '../fetchers/org-attestations.js';
import { sifaQueryKeys } from '../keys.js';

type Attestations = { attestations: OrgAttestation[] };
type Requests = { requests: AttestationRequest[] };

/** Every attestation the signed-in organization wrote. */
export function useOrgAttestations(
  options?: Omit<
    UseQueryOptions<
      Attestations,
      Error,
      Attestations,
      ReturnType<typeof sifaQueryKeys.org.attestations>
    >,
    'queryKey' | 'queryFn'
  >,
) {
  const config = useSifaConfig();
  return useQuery({
    queryKey: sifaQueryKeys.org.attestations(),
    queryFn: () => fetchOrgAttestations(config),
    ...options,
  });
}

/** Pending confirmation requests addressed to the signed-in organization. */
export function useAttestationRequests(
  options?: Omit<
    UseQueryOptions<
      Requests,
      Error,
      Requests,
      ReturnType<typeof sifaQueryKeys.org.attestationRequests>
    >,
    'queryKey' | 'queryFn'
  >,
) {
  const config = useSifaConfig();
  return useQuery({
    queryKey: sifaQueryKeys.org.attestationRequests(),
    queryFn: () => fetchAttestationRequests(config),
    ...options,
  });
}

function useInvalidateOrg() {
  const queryClient = useQueryClient();
  return async () => {
    await queryClient.invalidateQueries({ queryKey: sifaQueryKeys.org.all() });
  };
}

export function useCreateOrgAttestation(
  options?: Omit<
    UseMutationOptions<WriteResult<CreateOrgAttestationResult>, Error, CreateOrgAttestationInput>,
    'mutationFn'
  >,
) {
  const config = useSifaConfig();
  const invalidate = useInvalidateOrg();
  return useMutation({
    // Spread first so a consumer handler cannot drop the invalidation.
    ...options,
    mutationFn: (input: CreateOrgAttestationInput) => createOrgAttestation(config, input),
    onSuccess: async (result, variables, onMutateResult, context) => {
      if (result.success) await invalidate();
      await options?.onSuccess?.(result, variables, onMutateResult, context);
    },
  });
}

export function useOffboardOrgAttestation(
  options?: Omit<
    UseMutationOptions<WriteResult, Error, { rkey: string; endedAt?: string }>,
    'mutationFn'
  >,
) {
  const config = useSifaConfig();
  const invalidate = useInvalidateOrg();
  return useMutation({
    ...options,
    mutationFn: ({ rkey, endedAt }) => offboardOrgAttestation(config, rkey, { endedAt }),
    onSuccess: async (result, variables, onMutateResult, context) => {
      if (result.success) await invalidate();
      await options?.onSuccess?.(result, variables, onMutateResult, context);
    },
  });
}

export function useRevokeOrgAttestation(
  options?: Omit<UseMutationOptions<WriteResult, Error, string>, 'mutationFn'>,
) {
  const config = useSifaConfig();
  const invalidate = useInvalidateOrg();
  return useMutation({
    ...options,
    mutationFn: (rkey: string) => revokeOrgAttestation(config, rkey),
    onSuccess: async (result, variables, onMutateResult, context) => {
      if (result.success) await invalidate();
      await options?.onSuccess?.(result, variables, onMutateResult, context);
    },
  });
}

export function useRejectAttestationRequest(
  options?: Omit<UseMutationOptions<WriteResult, Error, number>, 'mutationFn'>,
) {
  const config = useSifaConfig();
  const invalidate = useInvalidateOrg();
  return useMutation({
    ...options,
    mutationFn: (id: number) => rejectAttestationRequest(config, id),
    onSuccess: async (result, variables, onMutateResult, context) => {
      if (result.success) await invalidate();
      await options?.onSuccess?.(result, variables, onMutateResult, context);
    },
  });
}

/** Employee side: ask the organization behind a position to confirm it. */
export function useRequestEmploymentConfirmation(
  options?: Omit<
    UseMutationOptions<
      WriteResult<RequestEmploymentConfirmationResult>,
      Error,
      RequestEmploymentConfirmationInput
    >,
    'mutationFn'
  >,
) {
  const config = useSifaConfig();
  return useMutation({
    ...options,
    mutationFn: (input: RequestEmploymentConfirmationInput) =>
      requestEmploymentConfirmation(config, input),
  });
}
