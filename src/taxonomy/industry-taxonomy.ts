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
