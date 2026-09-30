import { z } from 'zod';

import {
  apiFetch,
  apiWrite,
  apiWriteCreate,
  type ApiFetchOptions,
  type SifaApiConfig,
  type WriteResult,
} from '../client.js';

/**
 * Organization employment attestations (sifa-workspace#623). The org side
 * writes `id.sifa.org.employmentAttestation` records through the AppView,
 * which indexes them at once; the employee side asks for one.
 *
 * These are AppView READ and WRITE shapes, not PDS records: the record itself
 * is built server-side from the input, so a client never assembles one.
 */

export type AttestationStatus = 'current' | 'past';

/** Body accepted by {@link createOrgAttestation}. */
export interface CreateOrgAttestationInput {
  subjectDid: string;
  status: AttestationStatus;
  /** Portable entity id (Wikidata, ROR, LEI or sifa.id/company URI); omit to attest at the account. */
  entityRef?: string;
  title?: string;
  /** YYYY-MM or YYYY-MM-DD. */
  startedAt?: string;
  endedAt?: string;
  /** AT-URI of one of the subject's own positions; omit to attest employment at the entity. */
  positionUri?: string;
  positionCid?: string;
  comment?: string;
}

export interface CreateOrgAttestationResult {
  uri: string;
  rkey: string;
  renderState: string;
  matchedRkeys: string[];
  /** True when an equivalent attestation already existed and nothing was written. */
  existing: boolean;
}

export function createOrgAttestation(
  config: SifaApiConfig,
  input: CreateOrgAttestationInput,
  options: ApiFetchOptions = {},
): Promise<WriteResult<CreateOrgAttestationResult>> {
  return apiWriteCreate<CreateOrgAttestationResult>(
    config,
    '/api/org/attestations',
    input,
    options,
  );
}

/** Offboarding: the record stays, its status becomes past with an end date. */
export function offboardOrgAttestation(
  config: SifaApiConfig,
  rkey: string,
  input: { endedAt?: string },
  options: ApiFetchOptions = {},
): Promise<WriteResult> {
  return apiWrite(config, `/api/org/attestations/${encodeURIComponent(rkey)}`, 'PATCH', {
    body: { status: 'past', ...input },
    ...options,
  });
}

/** Revocation: deletes the record; the subject's log keeps an org_revoked entry. */
export function revokeOrgAttestation(
  config: SifaApiConfig,
  rkey: string,
  options: ApiFetchOptions = {},
): Promise<WriteResult> {
  return apiWrite(config, `/api/org/attestations/${encodeURIComponent(rkey)}`, 'DELETE', options);
}

export const OrgAttestationSchema = z
  .object({
    rkey: z.string(),
    uri: z.string(),
    subjectDid: z.string(),
    subjectHandle: z.string().nullable().optional(),
    subjectDisplayName: z.string().nullable().optional(),
    subjectAvatar: z.string().nullable().optional(),
    status: z.string(),
    source: z.string().nullable().optional(),
    title: z.string().nullable().optional(),
    startedAt: z.string().nullable().optional(),
    endedAt: z.string().nullable().optional(),
    positionUri: z.string().nullable().optional(),
    renderState: z.string(),
    matchedRkeys: z.array(z.string()).default([]),
    createdAt: z.string(),
  })
  .passthrough();
export type OrgAttestation = z.infer<typeof OrgAttestationSchema>;

const OrgAttestationsSchema = z.object({ attestations: z.array(OrgAttestationSchema).default([]) });

export const AttestationRequestSchema = z
  .object({
    id: z.number(),
    subjectDid: z.string(),
    subjectHandle: z.string().nullable().optional(),
    subjectDisplayName: z.string().nullable().optional(),
    subjectAvatar: z.string().nullable().optional(),
    positionRkey: z.string(),
    positionTitle: z.string().nullable().optional(),
    positionStartedAt: z.string().nullable().optional(),
    positionEndedAt: z.string().nullable().optional(),
    note: z.string().nullable().optional(),
    status: z.string(),
    createdAt: z.string(),
  })
  .passthrough();
export type AttestationRequest = z.infer<typeof AttestationRequestSchema>;

const AttestationRequestsSchema = z.object({
  requests: z.array(AttestationRequestSchema).default([]),
});

/** Options for the org-side reads, adding the RSC cookie-forwarding escape hatch. */
export interface FetchOrgAttestationOptions extends ApiFetchOptions {
  cookieHeader?: string;
}

function withCookie(options: FetchOrgAttestationOptions) {
  const { cookieHeader, ...rest } = options;
  const headers: Record<string, string> = { ...(rest.headers ?? {}) };
  if (cookieHeader) headers.cookie = cookieHeader;
  return { rest, headers };
}

/** Every attestation the signed-in organization wrote, newest first. Empty on failure. */
export async function fetchOrgAttestations(
  config: SifaApiConfig,
  options: FetchOrgAttestationOptions = {},
): Promise<{ attestations: OrgAttestation[] }> {
  const { rest, headers } = withCookie(options);
  try {
    const data = await apiFetch<unknown>(config, '/api/org/attestations', {
      cache: 'no-store',
      credentials: 'include',
      timeoutMs: 5000,
      ...rest,
      headers,
    });
    const parsed = OrgAttestationsSchema.safeParse(data);
    return parsed.success ? parsed.data : { attestations: [] };
  } catch {
    return { attestations: [] };
  }
}

/** Pending confirmation requests addressed to the signed-in organization. Empty on failure. */
export async function fetchAttestationRequests(
  config: SifaApiConfig,
  options: FetchOrgAttestationOptions = {},
): Promise<{ requests: AttestationRequest[] }> {
  const { rest, headers } = withCookie(options);
  try {
    const data = await apiFetch<unknown>(config, '/api/org/attestations/requests', {
      cache: 'no-store',
      credentials: 'include',
      timeoutMs: 5000,
      ...rest,
      headers,
    });
    const parsed = AttestationRequestsSchema.safeParse(data);
    return parsed.success ? parsed.data : { requests: [] };
  } catch {
    return { requests: [] };
  }
}

export function rejectAttestationRequest(
  config: SifaApiConfig,
  id: number,
  options: ApiFetchOptions = {},
): Promise<WriteResult> {
  return apiWrite(config, `/api/org/attestations/requests/${id}/reject`, 'POST', options);
}

/** Body accepted by {@link requestEmploymentConfirmation}. */
export interface RequestEmploymentConfirmationInput {
  positionRkey: string;
  note?: string;
}

export interface RequestEmploymentConfirmationResult {
  orgDid: string;
  id: number;
  /** False when a request was already pending; the same one is returned. */
  created: boolean;
}

/** Employee side: ask the organization behind one of your positions to confirm it. */
export function requestEmploymentConfirmation(
  config: SifaApiConfig,
  input: RequestEmploymentConfirmationInput,
  options: ApiFetchOptions = {},
): Promise<WriteResult<RequestEmploymentConfirmationResult>> {
  return apiWriteCreate<RequestEmploymentConfirmationResult>(
    config,
    '/api/verification/org/request',
    input,
    options,
  );
}
