/**
 * `@singi-labs/sifa-sdk/schemas/write` — Zod schemas that mirror the input
 * contracts of the sifa-api write endpoints. Client-side callers use these
 * to `.safeParse(...)` inputs before submitting.
 *
 * These are DELIBERATELY separate from the lexicon record schemas in
 * `@singi-labs/sifa-sdk/schemas`:
 * - Lexicon schemas describe the PDS record shape (wire format).
 * - Write schemas describe what sifa-api's HTTP endpoints accept (write policy).
 *
 * The two overlap heavily but diverge in ways that matter for UX (e.g., write
 * schemas allow explicit `null` for optional fields to round-trip API echoes;
 * lexicon schemas use `.optional()` because PDS records never carry `null`).
 * Client-side form validation should use THESE schemas so "passes locally"
 * matches "server accepts". Wire-shape assertions should use the lexicon
 * schemas.
 *
 * Source of truth: `sifa-api/src/routes/schemas.ts`. Any change to server-side
 * write policy must land here first, then be adopted in sifa-api.
 */

export {
  artifactLinkSchema,
  entityRefSchema,
  externalRecordRefSchema,
  httpUrlOrNull,
  isValidDateOnly,
  normalizeUrl,
  optionalUrl,
  presentationLinkSchema,
  skillRefSchema,
  VALID_PLATFORMS,
  writeLocationSchema,
  type ValidPlatform,
} from './shared.js';

export { CertificationWriteSchema, type CertificationWriteInput } from './certification.js';
export { CourseWriteSchema, type CourseWriteInput } from './course.js';
export { EducationWriteSchema, type EducationWriteInput } from './education.js';
export { ExternalAccountWriteSchema, type ExternalAccountWriteInput } from './external-account.js';
export { HonorWriteSchema, type HonorWriteInput } from './honor.js';
export { InvolvementWriteSchema, type InvolvementWriteInput } from './involvement.js';
export { InvestmentWriteSchema, type InvestmentWriteInput } from './investment.js';
export { LanguageWriteSchema, type LanguageWriteInput } from './language.js';
export {
  OrgEmploymentAttestationWriteSchema,
  type OrgEmploymentAttestationWriteInput,
} from './org-employment-attestation.js';
export { OrgProfileWriteSchema, type OrgProfileWriteInput } from './org-profile.js';
export { OrgClaimRequestSchema, type OrgClaimRequestInput } from './org-claim.js';
export {
  OrgProfileUpdateRequestSchema,
  type OrgProfileUpdateRequestInput,
  OrgDomainChallengeRequestSchema,
  type OrgDomainChallengeRequestInput,
  OrgDomainVerifyRequestSchema,
  type OrgDomainVerifyRequestInput,
  OrgNotificationEmailRequestSchema,
  type OrgNotificationEmailRequestInput,
} from './org-settings.js';
export { PositionWriteSchema, type PositionWriteInput } from './position.js';
export {
  PresentationDeliveryWriteSchema,
  type PresentationDeliveryWriteInput,
} from './presentation-delivery.js';
export { PresentationWriteSchema, type PresentationWriteInput } from './presentation.js';
export { ProfileLocationWriteSchema, type ProfileLocationWriteInput } from './profile-location.js';
export { ProfileSelfWriteSchema, type ProfileSelfWriteInput } from './profile-self.js';
export { ProjectWriteSchema, type ProjectWriteInput } from './project.js';
export {
  PublicationWriteSchema,
  publicationAuthorWriteSchema,
  type PublicationWriteInput,
} from './publication.js';
export { SkillWriteSchema, type SkillWriteInput } from './skill.js';
export { VolunteeringWriteSchema, type VolunteeringWriteInput } from './volunteering.js';
