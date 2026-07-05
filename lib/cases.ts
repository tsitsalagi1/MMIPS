import type { MmipsCase } from "./types";

export const sampleCases: MmipsCase[] = [
  {
    id: "demo-001",
    slug: "demo-case-family-approved",
    fullName: "Demo Case — Family Approved Placeholder",
    age: 27,
    tribalAffiliation: "Tribal affiliation shown only with family approval",
    status: "missing",
    verification: ["family_verified", "agency_case_number", "pending_review"],
    lastSeenDate: "2026-07-01",
    lastSeenLocation: "Tahlequah, Oklahoma",
    publicLocationNote: "Approximate city-level location shown for safety.",
    leadAgency: "Example Police Department",
    agencyCaseNumber: "EX-2026-0001",
    namusNumber: "Pending / unknown",
    ncicStatus: "requested",
    tribeNotified: "unknown",
    familyLiaison: "unknown",
    lastPublicUpdate: "2026-07-05",
    summary: "This is a placeholder record to show how a public case page will look after moderation. Replace with verified, family-approved information only.",
    photoUrl: "/placeholder-person.svg",
    tipPhone: "911 for emergencies; list official case tip line here",
    latitude: 35.9154,
    longitude: -94.96996,
    locationPrecision: "city",
    riskFlags: ["Public demo", "Do not use as a real case"]
  }
];

export function getCaseBySlug(slug: string) {
  return sampleCases.find((item) => item.slug === slug);
}
