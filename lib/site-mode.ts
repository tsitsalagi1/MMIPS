export type MmipsSiteMode = "us" | "global" | "ca";

export function mmipsSiteMode(): MmipsSiteMode {
  if (process.env.MMIPS_SITE_MODE === "global") return "global";
  if (process.env.MMIPS_SITE_MODE === "ca") return "ca";
  return "us";
}

export function globalSiteUrl() {
  return process.env.NEXT_PUBLIC_GLOBAL_SITE_URL || "https://mmips.com";
}

export function usSiteUrl() {
  return process.env.NEXT_PUBLIC_US_SITE_URL || "https://us.mmips.com";
}

export function canadaSiteUrl() {
  return process.env.NEXT_PUBLIC_CA_SITE_URL || "https://ca.mmips.com";
}

export function canadaPortalIsActive() {
  return process.env.MMIPS_CA_PORTAL_ACTIVE === "true" && Boolean(process.env.NEXT_PUBLIC_CA_SITE_URL);
}
