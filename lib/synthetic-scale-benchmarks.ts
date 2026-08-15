export type SyntheticScaleSource = "us" | "ca";

export type SyntheticScaleBenchmark = {
  source: SyntheticScaleSource;
  label: string;
  targetProfiles: number;
  missingProfiles: number;
  murderedUnsolvedProfiles: number;
  alaskaProfiles: number;
  territoryProfiles: number;
  territoryLabels: readonly string[];
  benchmarkLabel: string;
  currentReference: string;
  geographyReference: string;
  limitations: string;
  sourceUrls: readonly string[];
};

export const SYNTHETIC_SCALE_BENCHMARKS: Record<SyntheticScaleSource, SyntheticScaleBenchmark> = {
  us: {
    source: "us",
    label: "United States, including Alaska and the five populated territories",
    targetProfiles: 4200,
    missingProfiles: 1500,
    murderedUnsolvedProfiles: 2700,
    alaskaProfiles: 363,
    territoryProfiles: 125,
    territoryLabels: ["American Samoa", "Guam", "Northern Mariana Islands", "Puerto Rico", "U.S. Virgin Islands"],
    benchmarkLabel: "Approximate BIA national unresolved-case capacity benchmark",
    currentReference: "The FBI reported 1,476 active AI/AN missing-person records at year-end 2025. Alaska's 2026 Q1 official list contained 363 Alaska Native, American Indian, or unknown-race missing-person entries.",
    geographyReference: "U.S. Census Bureau January 1, 2025 American Indian, Alaska Native, and Native Hawaiian Areas, Alaska Native Village Statistical Areas, and state-equivalent geography for American Samoa, Guam, the Northern Mariana Islands, Puerto Rico, and the U.S. Virgin Islands.",
    limitations: "Counts set capacity only. The 125 territory fixtures are an even coverage allocation, not an official territory case count. Synthetic profiles do not represent prevalence, a real person's location, or an official case-to-place relationship.",
    sourceUrls: [
      "https://www.bia.gov/service/mmu/missing-and-murdered-indigenous-people-crisis",
      "https://www.fbi.gov/file-repository/cy-2025-mmip-missing-ai-an-one-pager-05042026.pdf",
      "https://dps.alaska.gov/wp-content/uploads/2026/05/2026-Q1.pdf",
      "https://tigerweb.geo.census.gov/arcgis/rest/services/TIGERweb/AIANNHA/MapServer/47",
      "https://tigerweb.geo.census.gov/arcgis/rest/services/TIGERweb/AIANNHA/MapServer/6",
      "https://tigerweb.geo.census.gov/arcgis/rest/services/TIGERweb/State_County/MapServer/2",
      "https://www.census.gov/programs-surveys/geography/about/glossary.html"
    ]
  },
  ca: {
    source: "ca",
    label: "Canada",
    targetProfiles: 1181,
    missingProfiles: 164,
    murderedUnsolvedProfiles: 1017,
    alaskaProfiles: 0,
    territoryProfiles: 0,
    territoryLabels: [],
    benchmarkLabel: "RCMP 1980–2012 historical national high-water benchmark",
    currentReference: "Canada does not publish a comparable current national open-case total. Statistics Canada reported 225 Indigenous homicide victims of all genders in 2024; that annual count is context, not a current open-case total.",
    geographyReference: "Indigenous Services Canada broad First Nations reserve, Inuit community, and Yukon First Nation point geography, covering every province and territory.",
    limitations: "The 1,181-profile load is a historical capacity benchmark, not a current-case claim. Synthetic profiles are allocated across broad official geography centroids and do not represent prevalence, a real person's location, or an official case-to-place relationship.",
    sourceUrls: [
      "https://publications.gc.ca/collections/collection_2015/trc/IR4-9-5-2015-eng.pdf",
      "https://www150.statcan.gc.ca/n1/daily-quotidien/250722/dq250722a-eng.htm",
      "https://services.sac-isc.gc.ca/geomatics/rest/services/AGOL_FEATURE_SERVICES/First_Nations_Aboriginal_Lands_E/FeatureServer/2",
      "https://geo.sac-isc.gc.ca/geomatics/rest/services/Donnees_Ouvertes-Open_Data/Communaute_inuite_Inuit_Community/MapServer/0",
      "https://geo.sac-isc.gc.ca/geomatics/rest/services/Donnees_Ouvertes-Open_Data/Premiere_Nation_First_Nation/MapServer/0"
    ]
  }
};

export function syntheticScaleStatus(source: SyntheticScaleSource, zeroBasedIndex: number) {
  const benchmark = SYNTHETIC_SCALE_BENCHMARKS[source];
  if (zeroBasedIndex < benchmark.missingProfiles) {
    return { status: "missing", profile_type: "missing" } as const;
  }
  return { status: "murdered_unsolved", profile_type: "murdered_info_needed" } as const;
}
