import { z } from 'zod';

/**
 * Schema enforced by `POST /profile/locations` on sifa-api.
 *
 * Mirrors the inner object of `writeLocationSchema`: accepts both the community
 * shape (`country`, `locality`) and the legacy shape (`countryCode`, `city`)
 * during the dual-read window. sifa-web #840 switched outbound writes to the
 * community shape; older clients may still send the legacy shape. All address
 * fields are `.nullish()` so explicit `null` from API echoes is accepted
 * (see sifa-api #426).
 *
 * The route handler hands `address` to `buildPdsLocation`, which normalizes
 * either input and enforces alpha-2 on the wire to PDS — returning a 400 with
 * `message: "address.country (alpha-2) is required"` when no usable code is
 * present. The schema stays permissive on country length here and lets
 * `buildPdsLocation` be the single enforcement point.
 */
export const ProfileLocationWriteSchema = z.object({
  address: z.object({
    country: z.string().nullish(),
    countryCode: z.string().length(2).nullish(),
    region: z.string().nullish(),
    city: z.string().nullish(),
    locality: z.string().nullish(),
    street: z.string().nullish(),
    postalCode: z.string().nullish(),
    name: z.string().nullish(),
  }),
  type: z.string().min(1),
  label: z.string().max(60).nullable().optional(),
  isPrimary: z.boolean().optional(),
});

export type ProfileLocationWriteInput = z.infer<typeof ProfileLocationWriteSchema>;
