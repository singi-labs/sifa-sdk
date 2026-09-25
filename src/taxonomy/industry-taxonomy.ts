/** Two-level industry/domain taxonomy for profile classification. */

export interface IndustryOption {
  value: string;
  labelKey: string;
  domains: { value: string; labelKey: string }[];
}

export const INDUSTRY_OPTIONS: IndustryOption[] = [
  {
    value: 'id.sifa.defs#industryTechnology',
    labelKey: 'industryTechnology',
    domains: [
      { value: 'id.sifa.defs#domainSoftwareEngineering', labelKey: 'domainSoftwareEngineering' },
      { value: 'id.sifa.defs#domainDataScience', labelKey: 'domainDataScience' },
      { value: 'id.sifa.defs#domainCybersecurity', labelKey: 'domainCybersecurity' },
      { value: 'id.sifa.defs#domainDevops', labelKey: 'domainDevops' },
      { value: 'id.sifa.defs#domainProductDesign', labelKey: 'domainProductDesign' },
      { value: 'id.sifa.defs#domainGameDev', labelKey: 'domainGameDev' },
    ],
  },
  {
    value: 'id.sifa.defs#industryFinance',
    labelKey: 'industryFinance',
    domains: [
      { value: 'id.sifa.defs#domainBanking', labelKey: 'domainBanking' },
      { value: 'id.sifa.defs#domainFintech', labelKey: 'domainFintech' },
      { value: 'id.sifa.defs#domainInsurance', labelKey: 'domainInsurance' },
      { value: 'id.sifa.defs#domainInvestmentMgmt', labelKey: 'domainInvestmentMgmt' },
    ],
  },
  {
    value: 'id.sifa.defs#industryHealthcare',
    labelKey: 'industryHealthcare',
    domains: [
      { value: 'id.sifa.defs#domainClinicalResearch', labelKey: 'domainClinicalResearch' },
      { value: 'id.sifa.defs#domainHealthtech', labelKey: 'domainHealthtech' },
      { value: 'id.sifa.defs#domainPharma', labelKey: 'domainPharma' },
    ],
  },
  {
    value: 'id.sifa.defs#industryEducation',
    labelKey: 'industryEducation',
    domains: [
      { value: 'id.sifa.defs#domainHigherEd', labelKey: 'domainHigherEd' },
      { value: 'id.sifa.defs#domainEdtech', labelKey: 'domainEdtech' },
      { value: 'id.sifa.defs#domainPrimarySecondary', labelKey: 'domainPrimarySecondary' },
    ],
  },
  {
    value: 'id.sifa.defs#industryMedia',
    labelKey: 'industryMedia',
    domains: [
      { value: 'id.sifa.defs#domainJournalism', labelKey: 'domainJournalism' },
      { value: 'id.sifa.defs#domainFilmVideo', labelKey: 'domainFilmVideo' },
      { value: 'id.sifa.defs#domainGaming', labelKey: 'domainGaming' },
      { value: 'id.sifa.defs#domainAdvertising', labelKey: 'domainAdvertising' },
    ],
  },
  {
    value: 'id.sifa.defs#industryRetail',
    labelKey: 'industryRetail',
    domains: [
      { value: 'id.sifa.defs#domainEcommerce', labelKey: 'domainEcommerce' },
      { value: 'id.sifa.defs#domainSupplyChain', labelKey: 'domainSupplyChain' },
    ],
  },
  {
    value: 'id.sifa.defs#industryManufacturing',
    labelKey: 'industryManufacturing',
    domains: [
      { value: 'id.sifa.defs#domainAutomotive', labelKey: 'domainAutomotive' },
      { value: 'id.sifa.defs#domainAerospace', labelKey: 'domainAerospace' },
      { value: 'id.sifa.defs#domainHardware', labelKey: 'domainHardware' },
    ],
  },
  {
    value: 'id.sifa.defs#industryEnergy',
    labelKey: 'industryEnergy',
    domains: [
      { value: 'id.sifa.defs#domainRenewables', labelKey: 'domainRenewables' },
      { value: 'id.sifa.defs#domainOilGas', labelKey: 'domainOilGas' },
      { value: 'id.sifa.defs#domainClimateTech', labelKey: 'domainClimateTech' },
    ],
  },
  {
    value: 'id.sifa.defs#industryGovernment',
    labelKey: 'industryGovernment',
    domains: [
      { value: 'id.sifa.defs#domainPublicPolicy', labelKey: 'domainPublicPolicy' },
      { value: 'id.sifa.defs#domainDefense', labelKey: 'domainDefense' },
    ],
  },
  {
    value: 'id.sifa.defs#industryLegal',
    labelKey: 'industryLegal',
    domains: [
      { value: 'id.sifa.defs#domainIpLaw', labelKey: 'domainIpLaw' },
      { value: 'id.sifa.defs#domainCompliance', labelKey: 'domainCompliance' },
    ],
  },
  {
    value: 'id.sifa.defs#industryConsulting',
    labelKey: 'industryConsulting',
    domains: [
      { value: 'id.sifa.defs#domainManagementConsulting', labelKey: 'domainManagementConsulting' },
      { value: 'id.sifa.defs#domainDevrel', labelKey: 'domainDevrel' },
      { value: 'id.sifa.defs#domainHrRecruitment', labelKey: 'domainHrRecruitment' },
    ],
  },
  {
    value: 'id.sifa.defs#industryNonprofit',
    labelKey: 'industryNonprofit',
    domains: [
      { value: 'id.sifa.defs#domainHumanRights', labelKey: 'domainHumanRights' },
      { value: 'id.sifa.defs#domainOpenSource', labelKey: 'domainOpenSource' },
    ],
  },
  {
    value: 'id.sifa.defs#industryRealEstate',
    labelKey: 'industryRealEstate',
    domains: [{ value: 'id.sifa.defs#domainProptech', labelKey: 'domainProptech' }],
  },
  {
    value: 'id.sifa.defs#industryTransport',
    labelKey: 'industryTransport',
    domains: [
      { value: 'id.sifa.defs#domainAutonomousVehicles', labelKey: 'domainAutonomousVehicles' },
      { value: 'id.sifa.defs#domainLogistics', labelKey: 'domainLogistics' },
    ],
  },
  {
    value: 'id.sifa.defs#industryAgriculture',
    labelKey: 'industryAgriculture',
    domains: [
      { value: 'id.sifa.defs#domainAgritech', labelKey: 'domainAgritech' },
      { value: 'id.sifa.defs#domainFoodTech', labelKey: 'domainFoodTech' },
    ],
  },
  {
    value: 'id.sifa.defs#industryHospitality',
    labelKey: 'industryHospitality',
    domains: [
      { value: 'id.sifa.defs#domainHotels', labelKey: 'domainHotels' },
      { value: 'id.sifa.defs#domainTravelTourism', labelKey: 'domainTravelTourism' },
      { value: 'id.sifa.defs#domainFoodBeverage', labelKey: 'domainFoodBeverage' },
    ],
  },
  {
    value: 'id.sifa.defs#industryTelecom',
    labelKey: 'industryTelecom',
    domains: [
      { value: 'id.sifa.defs#domainNetworkInfra', labelKey: 'domainNetworkInfra' },
      { value: 'id.sifa.defs#domainMobileServices', labelKey: 'domainMobileServices' },
    ],
  },
  {
    value: 'id.sifa.defs#industryMining',
    labelKey: 'industryMining',
    domains: [
      { value: 'id.sifa.defs#domainExtraction', labelKey: 'domainExtraction' },
      { value: 'id.sifa.defs#domainGeological', labelKey: 'domainGeological' },
    ],
  },
  {
    value: 'id.sifa.defs#industryFashion',
    labelKey: 'industryFashion',
    domains: [
      { value: 'id.sifa.defs#domainFashionDesign', labelKey: 'domainFashionDesign' },
      { value: 'id.sifa.defs#domainTextileManufacturing', labelKey: 'domainTextileManufacturing' },
    ],
  },
  {
    value: 'id.sifa.defs#industryMaritime',
    labelKey: 'industryMaritime',
    domains: [
      { value: 'id.sifa.defs#domainShipping', labelKey: 'domainShipping' },
      { value: 'id.sifa.defs#domainPortOperations', labelKey: 'domainPortOperations' },
      { value: 'id.sifa.defs#domainNavalArchitecture', labelKey: 'domainNavalArchitecture' },
    ],
  },
  {
    value: 'id.sifa.defs#industryOther',
    labelKey: 'industryOther',
    domains: [],
  },
];

/** Find the industry option for a given industry value. */
export function findIndustry(value: string | undefined | null): IndustryOption | undefined {
  if (!value) return undefined;
  return INDUSTRY_OPTIONS.find((i) => i.value === value);
}

/** Get the label key for an industry or domain token, falling back to the raw value. */
export function getIndustryLabelKey(value: string): string {
  for (const industry of INDUSTRY_OPTIONS) {
    if (industry.value === value) return industry.labelKey;
    for (const domain of industry.domains) {
      if (domain.value === value) return domain.labelKey;
    }
  }
  return value;
}

/**
 * Literal English labels for every industry and domain `labelKey`. Canonical for
 * consumers without an i18n layer (the mobile app). Web can keep resolving the
 * `labelKey` through next-intl; the `profileEdit.<labelKey>` English MUST match
 * these strings so the two never drift.
 */
export const INDUSTRY_LABELS: Record<string, string> = {
  industryTechnology: 'Technology',
  domainSoftwareEngineering: 'Software Engineering',
  domainDataScience: 'Data Science & ML',
  domainCybersecurity: 'Cybersecurity',
  domainDevops: 'DevOps & Infrastructure',
  domainProductDesign: 'Product & UX Design',
  domainGameDev: 'Game Development',
  industryFinance: 'Finance & Banking',
  domainBanking: 'Banking',
  domainFintech: 'Fintech',
  domainInsurance: 'Insurance',
  domainInvestmentMgmt: 'Investment Management',
  industryHealthcare: 'Healthcare & Life Sciences',
  domainClinicalResearch: 'Clinical Research',
  domainHealthtech: 'Health Technology',
  domainPharma: 'Pharmaceuticals',
  industryEducation: 'Education & Research',
  domainHigherEd: 'Higher Education',
  domainEdtech: 'Education Technology',
  domainPrimarySecondary: 'Primary & Secondary Education',
  industryMedia: 'Media & Entertainment',
  domainJournalism: 'Journalism',
  domainFilmVideo: 'Film & Video',
  domainGaming: 'Gaming & Interactive Media',
  domainAdvertising: 'Advertising & Marketing',
  industryRetail: 'Retail & E-commerce',
  domainEcommerce: 'E-commerce',
  domainSupplyChain: 'Supply Chain & Fulfillment',
  industryManufacturing: 'Manufacturing & Engineering',
  domainAutomotive: 'Automotive',
  domainAerospace: 'Aerospace & Defense',
  domainHardware: 'Hardware & Electronics',
  industryEnergy: 'Energy & Environment',
  domainRenewables: 'Renewable Energy',
  domainOilGas: 'Oil & Gas',
  domainClimateTech: 'Climate Tech',
  industryGovernment: 'Government & Public Sector',
  domainPublicPolicy: 'Public Policy',
  domainDefense: 'Defense & Intelligence',
  industryLegal: 'Legal',
  domainIpLaw: 'Intellectual Property',
  domainCompliance: 'Compliance & Regulatory',
  industryConsulting: 'Consulting & Professional Services',
  domainManagementConsulting: 'Management Consulting',
  domainDevrel: 'Developer Relations',
  domainHrRecruitment: 'HR & Recruitment',
  industryNonprofit: 'Non-profit & Social Impact',
  domainHumanRights: 'Human Rights',
  domainOpenSource: 'Open Source',
  industryRealEstate: 'Real Estate & Construction',
  domainProptech: 'Property Technology',
  industryTransport: 'Transportation & Logistics',
  domainAutonomousVehicles: 'Autonomous Vehicles',
  domainLogistics: 'Logistics & Warehousing',
  industryAgriculture: 'Agriculture & Food',
  domainAgritech: 'Agricultural Technology',
  domainFoodTech: 'Food Technology & Processing',
  industryHospitality: 'Hospitality & Tourism',
  domainHotels: 'Hotels & Accommodation',
  domainTravelTourism: 'Travel & Tourism',
  domainFoodBeverage: 'Food & Beverage',
  industryTelecom: 'Telecommunications',
  domainNetworkInfra: 'Network Infrastructure',
  domainMobileServices: 'Mobile & Wireless Services',
  industryMining: 'Mining & Resources',
  domainExtraction: 'Extraction & Processing',
  domainGeological: 'Geological Services',
  industryFashion: 'Fashion & Textiles',
  domainFashionDesign: 'Fashion Design',
  domainTextileManufacturing: 'Textile Manufacturing',
  industryMaritime: 'Maritime & Shipping',
  domainShipping: 'Shipping & Freight',
  domainPortOperations: 'Port & Terminal Operations',
  domainNavalArchitecture: 'Naval Architecture & Marine Engineering',
  industryOther: 'Other',
};

/**
 * Resolve an industry or domain lex value to its literal English label. Falls
 * back to the labelKey (never the raw `id.sifa.defs#…` lex value), matching
 * {@link getIndustryLabelKey}, so an unknown value never leaks a lex id to the UI.
 */
export function getIndustryLabel(value: string): string {
  const labelKey = getIndustryLabelKey(value);
  return INDUSTRY_LABELS[labelKey] ?? labelKey;
}
