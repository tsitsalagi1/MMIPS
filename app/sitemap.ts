import type { MetadataRoute } from "next";
import { mmipsSiteMode } from "../lib/site-mode";

export default function sitemap(): MetadataRoute.Sitemap {
  const isGlobal = mmipsSiteMode() === "global";
  const base = (process.env.NEXT_PUBLIC_SITE_URL || (isGlobal ? "https://mmips.com" : "https://us.mmips.com")).replace(/\/$/, "");

  if (isGlobal) {
    return [{ url: base, changeFrequency: "weekly", priority: 1 }];
  }

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
