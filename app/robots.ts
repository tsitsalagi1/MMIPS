import type { MetadataRoute } from "next";
import { mmipsSiteMode } from "../lib/site-mode";

export default function robots(): MetadataRoute.Robots {
  const mode = mmipsSiteMode();
  const base = process.env.NEXT_PUBLIC_SITE_URL || (mode === "ca" ? "https://ca.mmips.com" : "https://mmips.com");

  if (mode === "global") {
    return {
      rules: {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/admin/", "/profiles", "/map", "/alerts", "/submit", "/resources", "/corrections", "/data-policy", "/safety-policy"]
      },
      sitemap: `${base.replace(/\/$/, "")}/sitemap.xml`
    };
  }

  if (mode === "ca") {
    return {
      rules: {
        userAgent: "*",
        allow: ["/", "/profiles", "/profiles/", "/resources", "/how-it-works", "/submit", "/privacy"],
        disallow: ["/api/", "/admin/", "/alerts", "/corrections", "/data-policy", "/safety-policy", "/terms"]
      },
      sitemap: `${base.replace(/\/$/, "")}/sitemap.xml`
    };
  }

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/"]
    },
    sitemap: `${base.replace(/\/$/, "")}/sitemap.xml`
  };
}
