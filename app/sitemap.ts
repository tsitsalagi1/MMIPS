import type { MetadataRoute } from "next";
import { mmipsSiteMode } from "../lib/site-mode";

export default function sitemap(): MetadataRoute.Sitemap {
  const mode = mmipsSiteMode();
  const base = (process.env.NEXT_PUBLIC_SITE_URL || (mode === "ca" ? "https://ca.mmips.com" : "https://mmips.com")).replace(/\/$/, "");

  if (mode === "global") {
    return [{ url: base, changeFrequency: "weekly", priority: 1 }];
  }

  if (mode === "ca") {
    const canadaPaths = ["", "/profiles", "/alerts", "/resources", "/how-it-works", "/submit", "/privacy"];
    return canadaPaths.map((path) => ({
      url: `${base}${path}`,
      changeFrequency: path === "/profiles" ? "daily" : "weekly",
      priority: path === "" ? 1 : path === "/profiles" ? 0.9 : 0.7
    }));
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
