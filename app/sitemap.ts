import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = (process.env.NEXT_PUBLIC_SITE_URL || "https://mmips.com").replace(/\/$/, "");
  const paths = [
    "",
    "/profiles",
    "/alerts",
    "/map",
    "/submit",
    "/resources",
    "/how-it-works",
    "/corrections",
    "/safety-policy",
    "/data-policy",
    "/privacy",
    "/terms"
  ];

  return paths.map((path) => ({
    url: `${base}${path}`,
    changeFrequency: path === "/profiles" || path === "/map" ? "daily" : "weekly",
    priority: path === "" ? 1 : path === "/profiles" ? 0.9 : 0.7
  }));
}
