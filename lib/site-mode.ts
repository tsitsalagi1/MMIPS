export type MmipsSiteMode = "us" | "global";

export function mmipsSiteMode(): MmipsSiteMode {
  return process.env.MMIPS_SITE_MODE === "global" ? "global" : "us";
}

export function globalSiteUrl() {
  return process.env.NEXT_PUBLIC_GLOBAL_SITE_URL || "https://mmips.com";
}

export function usSiteUrl() {
  return process.env.NEXT_PUBLIC_US_SITE_URL || "https://us.mmips.com";
}
