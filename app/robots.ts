import type { MetadataRoute } from "next";
import { mmipsSiteMode } from "../lib/site-mode";

export default function robots(): MetadataRoute.Robots {
  const mode = mmipsSiteMode();
  const isCountryShell = mode === "global" || mode === "ca";
  const base = process.env.NEXT_PUBLIC_SITE_URL || (mode === "ca" ? "https://ca.mmips.com" : "https://mmips.com");

  return {
    rules: isCountryShell
      ? {
          userAgent: "*",
          allow: "/",
          disallow: [
            "/api/",
            "/admin/",
            "/profiles",
            "/map",
            "/alerts",
            "/submit",
            "/resources",
            "/corrections",
            "/data-policy",
            "/safety-policy"
          ]
        }
      : {
          userAgent: "*",
          allow: "/",
          disallow: ["/api/"]
        },
    sitemap: `${base.replace(/\/$/, "")}/sitemap.xml`
  };
}
