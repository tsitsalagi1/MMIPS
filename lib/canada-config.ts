export const CANADA_PROVINCES_AND_TERRITORIES = [
  { code: "AB", name: "Alberta", type: "province" },
  { code: "BC", name: "British Columbia", type: "province" },
  { code: "MB", name: "Manitoba", type: "province" },
  { code: "NB", name: "New Brunswick", type: "province" },
  { code: "NL", name: "Newfoundland and Labrador", type: "province" },
  { code: "NS", name: "Nova Scotia", type: "province" },
  { code: "NT", name: "Northwest Territories", type: "territory" },
  { code: "NU", name: "Nunavut", type: "territory" },
  { code: "ON", name: "Ontario", type: "province" },
  { code: "PE", name: "Prince Edward Island", type: "province" },
  { code: "QC", name: "Quebec", type: "province" },
  { code: "SK", name: "Saskatchewan", type: "province" },
  { code: "YT", name: "Yukon", type: "territory" }
] as const;

export type CanadaProvinceTerritoryCode = (typeof CANADA_PROVINCES_AND_TERRITORIES)[number]["code"];

// Canada Post uses the ANA NAN structure. This expression also excludes letters
// that Canada Post does not use in Canadian postal codes.
export const CANADA_POSTAL_CODE_REGEX = /^[ABCEGHJ-NPRSTVXY]\d[ABCEGHJ-NPRSTVWXYZ][ -]?\d[ABCEGHJ-NPRSTVWXYZ]\d$/i;

export function normalizeCanadianPostalCode(value: string) {
  const compact = value.trim().toUpperCase().replace(/\s+/g, "").replace(/-/g, "");
  if (compact.length !== 6 || !CANADA_POSTAL_CODE_REGEX.test(compact)) return null;
  return `${compact.slice(0, 3)} ${compact.slice(3)}`;
}

export const CANADA_INDIGENOUS_CONTEXTS = [
  "First Nations",
  "Inuit",
  "Métis",
  "More than one Indigenous People or community",
  "Prefer to self-describe",
  "Prefer not to say"
] as const;

export const CANADA_PUBLIC_REPORTING_GUIDANCE = {
  emergency: "If someone is in immediate danger, call 911.",
  missingPerson: "Contact the police service of jurisdiction as soon as you are concerned for a person's safety. There is no 24-hour waiting period to report someone missing.",
  nationalCoordination: "The RCMP National Centre for Missing Persons and Unidentified Remains supports missing-person and unidentified-remains investigations across Canada; it does not replace the local police report."
} as const;

export const CANADA_OFFICIAL_REFERENCE_URLS = {
  rcmpMissingPersonGuidance: "https://www.rcmp-grc.gc.ca/en/news/2023/best-practices-reporting-a-missing-person",
  rcmpNationalCentre: "https://www.rcmp-grc.gc.ca/en/non-province-division/nhq?page=94%2C",
  indigenousTerminology: "https://www.canada.ca/en/library-archives/collection/research-help/indigenous-history/indigenous-terminology.html",
  provincesTerritories: "https://www.canada.ca/en/intergovernmental-affairs/services/provinces-territories.html",
  privacySafeguards: "https://www.priv.gc.ca/en/privacy-topics/privacy-laws-in-canada/the-personal-information-protection-and-electronic-documents-act-pipeda/p_principle/principles/p_safeguards/",
  postalCodes: "https://www.canadapost-postescanada.ca/cpc/en/support/articles/addressing-guidelines/postal-codes.page"
} as const;
