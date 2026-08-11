import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === "development";
const siteMode = process.env.MMIPS_SITE_MODE;
const isGlobalGateway = siteMode === "global";

function safeHttpsOrigin(value: string | undefined) {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" ? url.origin : null;
  } catch {
    return null;
  }
}

const configuredSupabaseOrigin = safeHttpsOrigin(process.env.NEXT_PUBLIC_SUPABASE_URL);
const fallbackUsSupabaseOrigin = siteMode === "ca" ? null : "https://borhgkrydfuqgabkhxsr.supabase.co";
const fallbackUsSupabaseWebSocketOrigin = siteMode === "ca" ? null : "wss://borhgkrydfuqgabkhxsr.supabase.co";
const supabaseOrigin = configuredSupabaseOrigin || fallbackUsSupabaseOrigin;
const supabaseWebSocketOrigin = configuredSupabaseOrigin
  ? configuredSupabaseOrigin.replace(/^https:/, "wss:")
  : fallbackUsSupabaseWebSocketOrigin;

const countrySiteContentSecurityPolicy = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""} https://challenges.cloudflare.com`,
  "style-src 'self' 'unsafe-inline'",
  `img-src 'self' data: blob:${supabaseOrigin ? ` ${supabaseOrigin}` : ""} https://api.maptiler.com`,
  "font-src 'self' data: https://api.maptiler.com",
  `connect-src 'self'${supabaseOrigin ? ` ${supabaseOrigin}` : ""}${supabaseWebSocketOrigin ? ` ${supabaseWebSocketOrigin}` : ""} https://api.maptiler.com https://challenges.cloudflare.com`,
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

const contentSecurityPolicy = isGlobalGateway
  ? globalGatewayContentSecurityPolicy
  : countrySiteContentSecurityPolicy;

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
