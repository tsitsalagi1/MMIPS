import type { NextConfig } from "next";

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
  { key: "X-Frame-Options", value: "DENY" }
];

const nextConfig: NextConfig = {
  experimental: {},
  async headers() {
    return [
      { source: "/(.*)", headers: securityHeaders },
      { source: "/admin/:path*", headers: [{ key: "Cache-Control", value: "no-store, private" }] },
      { source: "/api/admin/:path*", headers: [{ key: "Cache-Control", value: "no-store, private" }] }
    ];
  }
};

export default nextConfig;
