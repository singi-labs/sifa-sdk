/**
 * Private contact details for exports: email, phone and postal address.
 *
 * Sifa never stores these and never writes them to the owner's PDS, where they
 * would be public. The owner types them on the export page, the browser keeps
 * them, and they go only into the files the owner downloads. This module holds
 * the shape, the limits and the pick rule, so the export page and the server
 * that builds a funder CV agree on them.
 */

import { z } from 'zod';

/** Longest value accepted per field. 254 is the longest valid email address. */
export const EXPORT_CONTACT_LIMITS = {
  email: 254,
  phone: 40,
  address: 500,
} as const;

/** The contact details that go into an export. Absent keys are left out. */
export interface ExportContact {
  readonly email?: string;
  readonly phone?: string;
  /** Free text; lines are separated by `\n`. */
  readonly address?: string;
}

/** What the owner has typed, plus which fields they chose to include. */
export interface ExportContactDraft {
  readonly email?: string;
  readonly phone?: string;
  readonly address?: string;
  readonly includeEmail?: boolean;
  readonly includePhone?: boolean;
  readonly includeAddress?: boolean;
}

/**
 * Validates a picked contact. Only lengths are checked: phone numbers and
 * addresses vary too much between countries, and a wrong-looking email is a
 * warning for the owner, not a reason to refuse the export.
 */
export const exportContactSchema = z.strictObject({
  email: z.string().max(EXPORT_CONTACT_LIMITS.email).optional(),
  phone: z.string().max(EXPORT_CONTACT_LIMITS.phone).optional(),
  address: z.string().max(EXPORT_CONTACT_LIMITS.address).optional(),
});

/**
 * The fields to put in an export: the included ones that are not blank, run
 * through {@link normalizeExportContact}.
 */
export function pickExportContact(draft: ExportContactDraft): ExportContact {
  return normalizeExportContact({
    email: draft.includeEmail ? draft.email : undefined,
    phone: draft.includePhone ? draft.phone : undefined,
    address: draft.includeAddress ? draft.address : undefined,
  });
}

/**
 * Drops blank fields and tidies the rest. Email and phone become one line with
 * single spaces. An address keeps its line breaks but loses blank lines and the
 * spaces around each line. The emitters call this too, so a caller that skips
 * {@link pickExportContact} gets the same output.
 */
export function normalizeExportContact(contact: ExportContact): ExportContact {
  const email = oneLine(contact.email);
  const phone = oneLine(contact.phone);
  const address = lines(contact.address);
  return {
    ...(email ? { email } : {}),
    ...(phone ? { phone } : {}),
    ...(address ? { address } : {}),
  };
}

/** A loose shape check for a non-blocking "check this address" hint. */
export function looksLikeEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

function oneLine(value: string | undefined): string | undefined {
  const collapsed = value?.replace(/\s+/g, ' ').trim();
  return collapsed ? collapsed : undefined;
}

function lines(value: string | undefined): string | undefined {
  const kept = (value ?? '')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  return kept.length > 0 ? kept.join('\n') : undefined;
}
