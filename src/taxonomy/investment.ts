/**
 * Investment taxonomy. Mirrors `id.sifa.defs#investmentRole`, `#investmentStage`
 * and `#investmentStatus` from sifa-lexicons.
 *
 * These describe a capital position: money the person put in. Roles with duties --
 * board seats, advisory work -- are positions, not investments, and carry their own
 * `employmentType` values instead.
 */

export interface InvestmentOption {
  value: string;
  label: string;
}

/**
 * How the capital went in.
 *
 * General partner is deliberately absent. Running a fund is a role, recorded as an
 * `id.sifa.profile.position`, and offering it here would invite listing a fund's
 * entire portfolio as personal cheques. A partner's own commitment to their fund is
 * a `limitedPartner` entry naming that fund.
 */
export const INVESTMENT_ROLE_OPTIONS: InvestmentOption[] = [
  { value: 'id.sifa.defs#angelInvestment', label: 'Angel' },
  { value: 'id.sifa.defs#syndicateInvestment', label: 'Syndicate member' },
  { value: 'id.sifa.defs#limitedPartner', label: 'Limited partner' },
  { value: 'id.sifa.defs#otherInvestment', label: 'Other' },
];

/** The company's funding stage at the time of the investment, not its stage today. */
export const INVESTMENT_STAGE_OPTIONS: InvestmentOption[] = [
  { value: 'id.sifa.defs#stagePreSeed', label: 'Pre-seed' },
  { value: 'id.sifa.defs#stageSeed', label: 'Seed' },
  { value: 'id.sifa.defs#stageSeriesA', label: 'Series A' },
  { value: 'id.sifa.defs#stageSeriesB', label: 'Series B' },
  { value: 'id.sifa.defs#stageSeriesCPlus', label: 'Series C or later' },
  { value: 'id.sifa.defs#stageGrowth', label: 'Growth' },
  { value: 'id.sifa.defs#stageSecondary', label: 'Secondary' },
  { value: 'id.sifa.defs#stageOther', label: 'Other' },
];

/**
 * Where the position stands now. Recording a write-off is showing your work; nothing
 * in Sifa derives a hit rate or a return from these values.
 */
export const INVESTMENT_STATUS_OPTIONS: InvestmentOption[] = [
  { value: 'id.sifa.defs#investmentActive', label: 'Active' },
  { value: 'id.sifa.defs#investmentExited', label: 'Exited' },
  { value: 'id.sifa.defs#investmentWrittenOff', label: 'Written off' },
  { value: 'id.sifa.defs#investmentUndisclosed', label: 'Undisclosed' },
];

function toLabels(options: InvestmentOption[]): Record<string, string> {
  return Object.fromEntries(options.map((o) => [o.value, o.label]));
}

export const INVESTMENT_ROLE_LABELS: Record<string, string> = toLabels(INVESTMENT_ROLE_OPTIONS);
export const INVESTMENT_STAGE_LABELS: Record<string, string> = toLabels(INVESTMENT_STAGE_OPTIONS);
export const INVESTMENT_STATUS_LABELS: Record<string, string> = toLabels(INVESTMENT_STATUS_OPTIONS);

function resolve(
  labels: Record<string, string>,
  value: string | undefined | null,
): string | undefined {
  if (!value) return undefined;
  return labels[value] ?? value;
}

/** Resolve a label for an investment-role token. Falls back to the raw value. */
export function getInvestmentRoleLabel(value: string | undefined | null): string | undefined {
  return resolve(INVESTMENT_ROLE_LABELS, value);
}

/** Resolve a label for an investment-stage token. Falls back to the raw value. */
export function getInvestmentStageLabel(value: string | undefined | null): string | undefined {
  return resolve(INVESTMENT_STAGE_LABELS, value);
}

/** Resolve a label for an investment-status token. Falls back to the raw value. */
export function getInvestmentStatusLabel(value: string | undefined | null): string | undefined {
  return resolve(INVESTMENT_STATUS_LABELS, value);
}
