'use client';

import { useMutation, type UseMutationOptions } from '@tanstack/react-query';

import type { WriteResult } from '../client.js';
import { useSifaConfig } from '../config.js';
import {
  addOrgNotificationEmail,
  removeOrgNotificationEmail,
  type OrgNotificationEmailAddResult,
  type OrgNotificationEmailRemoveResult,
} from '../fetchers/org.js';
import type { OrgNotificationEmailRequestInput } from '../../schemas/write/org-settings.js';

type OrgNotificationEmailAddMutationResult = WriteResult & Partial<OrgNotificationEmailAddResult>;
type OrgNotificationEmailRemoveMutationResult = WriteResult &
  Partial<OrgNotificationEmailRemoveResult>;

/**
 * Add an org notification email (`POST /api/org/notification-emails`). The
 * address must use a domain the org controls (checked server-side). Sending is
 * gated behind the dormant email pipeline until activated.
 */
export function useAddOrgNotificationEmail(
  options?: Omit<
    UseMutationOptions<
      OrgNotificationEmailAddMutationResult,
      Error,
      OrgNotificationEmailRequestInput
    >,
    'mutationFn'
  >,
) {
  const config = useSifaConfig();
  return useMutation({
    mutationFn: (body: OrgNotificationEmailRequestInput) => addOrgNotificationEmail(config, body),
    ...options,
  });
}

/**
 * Remove an org notification email (`DELETE /api/org/notification-emails`).
 */
export function useRemoveOrgNotificationEmail(
  options?: Omit<
    UseMutationOptions<
      OrgNotificationEmailRemoveMutationResult,
      Error,
      OrgNotificationEmailRequestInput
    >,
    'mutationFn'
  >,
) {
  const config = useSifaConfig();
  return useMutation({
    mutationFn: (body: OrgNotificationEmailRequestInput) =>
      removeOrgNotificationEmail(config, body),
    ...options,
  });
}
