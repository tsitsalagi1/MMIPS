import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === "development";
const isGlobal = process.env.MMIPS_SITE_MODE === "global";
const supabaseOrigin = "https://borhgkrydfuqgabkhxsr.supabase.co";
const supabaseWebSocketOrigin = "wss://borhgkrydfuqgabkhxsr.supabase.co";

const unitedStatesContentSecurityPolicy = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""} https://challenges.cloudflare.com`,
  "style-src 'self' 'unsafe-inline'",
  `img-src 'self' data: blob: ${supabaseOrigin} https://api.maptiler.com`,
  "font-src 'self' data: https://api.maptiler.com",
  `connect-src 'self' ${supabaseOrigin} ${supabaseWebSocketOrigin} https://api.maptiler.com https://challenges.cloudflare.com`,
  "worker-src blob:",
  "child-src blob:",
  "frame-src https://challenges.cloudflare.com",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "upgrade-insecure-requests"
].join("; ");

const globalGatewayContentSecurityPolicy = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data:",
  "font-src 'self' data:",
  "connect-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "upgrade-insecure-requests"
].join("; ");

const contentSecurityPolicy = isGlobal
  ? globalGatewayContentSecurityPolicy
  : unitedStatesContentSecurityPolicy;

const securityHeaders = [
  { key: "Content-Security-Policy", value: contentSecurityPolicy },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), browsing-topics=()" },
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
