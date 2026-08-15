export type GlobalEvidenceItem = {
  region: string;
  figure: string;
  heading: string;
  summary: string;
  scope: string;
  sourceLabel: string;
  sourceUrl: string;
};

export const GLOBAL_MMIP_EVIDENCE: GlobalEvidenceItem[] = [
  {
    region: "United States",
    figure: "About 4,200",
    heading: "Estimated unsolved MMIP cases",
    summary: "The Bureau of Indian Affairs estimates about 1,500 American Indian and Alaska Native missing-person cases and about 2,700 murder and nonnegligent-homicide cases remain unsolved.",
    scope: "BIA estimate; the agency also warns that no reliable national count exists.",
    sourceLabel: "Bureau of Indian Affairs",
    sourceUrl: "https://www.bia.gov/service/mmu/missing-and-murdered-indigenous-people-crisis"
  },
  {
    region: "Canada",
    figure: "1,181",
    heading: "Police-recorded cases in a historical review",
    summary: "A 2014 RCMP review covering 1980–2012 identified 1,017 homicides of Indigenous women and girls and 164 unresolved missing-person cases.",
    scope: "Historical police review; it is not a current or complete total for all Indigenous people.",
    sourceLabel: "Truth and Reconciliation Commission of Canada",
    sourceUrl: "https://publications.gc.ca/collections/collection_2015/trc/IR4-9-5-2015-eng.pdf"
  },
  {
    region: "Mexico",
    figure: "More than 128,000",
    heading: "People recorded missing nationwide",
    summary: "The Inter-American Commission on Human Rights reported that more than 128,000 people were listed as missing when its Mexico report was finalized in June 2025.",
    scope: "All people in Mexico; the published figure is not an Indigenous-only count.",
    sourceLabel: "Inter-American Commission on Human Rights",
    sourceUrl: "https://www.oas.org/en/iachr/jsForm/?File=%2Fen%2Fiachr%2Fmedia_center%2Fpreleases%2F2026%2F082.asp"
  }
];

export const GLOBAL_DATA_GAP = {
  figure: "No reliable global total",
  summary: "Countries use different definitions and systems, many cases are underreported or misclassified, and Indigenous identity is often missing from official records. These country figures cannot be added together.",
  context: "The United Nations Committee on the Elimination of Discrimination against Women estimates that one in three Indigenous women is raped during her lifetime and says evidence about violence varies greatly by issue and region. That is broader violence evidence, not an MMIP case count.",
  sourceLabel: "UN CEDAW General Recommendation No. 39",
  sourceUrl: "https://docstore.ohchr.org/SelfServices/FilesHandler.ashx?enc=J24Le1oxw56%2Bk8%2FlnCpsHKaI2OZ6VkHONsqWewinyVTKgFEDQ9tNvBl073CKoBsXu8EDNYCLoXKa8dwszQo04w%3D%3D"
} as const;
