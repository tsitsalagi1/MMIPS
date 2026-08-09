import type { MetadataRoute } from "next";
import { mmipsSiteMode } from "../lib/site-mode";

export default function robots(): MetadataRoute.Robots {
  const isGlobal = mmipsSiteMode() === "global";
  const base = process.env.NEXT_PUBLIC_SITE_URL || (isGlobal ? "https://mmips.com" : "https://us.mmips.com");

  return {
    rules: isGlobal
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
