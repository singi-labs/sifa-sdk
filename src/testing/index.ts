/**
 * Shared test data for the apps built on the SDK.
 *
 * `WIRE_PROFILES` are real profile responses from the public Sifa API,
 * anonymized by `scripts/refresh-wire-fixtures.mjs` (`pnpm fixtures:wire`).
 * They keep the shape the API sends (string `location` plus `locations[]`,
 * linked accounts, records in storage order) and drop all personal text.
 * Hand-written fixtures hid bugs that only this shape shows, so export and
 * rendering tests should run on these.
 *
 * For tests only: importing this entry pulls the fixture data into the bundle.
 */
import type { ExportContact } from '../resume/export-contact.js';
import type { Profile } from '../types/index.js';
import profileA from './wire/profile-a.json';

export interface WireProfile {
  /** The fixture file name without `.json`. */
  name: string;
  profile: Profile;
}

// The fixtures are recorded API responses. The SDK has no Zod schema for the
// full profile view, so they are typed as the `Profile` the web app receives.
export const WIRE_PROFILES: readonly WireProfile[] = [
  { name: 'profile-a', profile: profileA as unknown as Profile },
];

/** Every export contact and personal detail filled in, all within the limits. */
export const SAMPLE_EXPORT_CONTACT: Required<ExportContact> = {
  email: 'a@example.com',
  phone: '+31 6 0000 0000',
  address: 'Street 1\nCity',
  driversLicense: 'B',
  rightToWork: 'EU citizen',
  nationality: 'Dutch',
};
