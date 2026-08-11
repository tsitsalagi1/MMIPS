import { NextRequest, NextResponse } from "next/server";

const isDev = process.env.NODE_ENV === "development";

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
const fallbackUsSupabaseOrigin = process.env.MMIPS_SITE_MODE === "ca" ? null : "https://borhgkrydfuqgabkhxsr.supabase.co";
const supabaseOrigin = configuredSupabaseOrigin || fallbackUsSupabaseOrigin;
const supabaseWebSocketOrigin = supabaseOrigin ? supabaseOrigin.replace(/^https:/, "wss:") : null;

function adminContentSecurityPolicy(nonce: string) {
  return [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${isDev ? " 'unsafe-eval'" : ""} https://challenges.cloudflare.com`,
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
}

function isCountryShellAsset(pathname: string) {
  return pathname.startsWith("/_next/") ||
    pathname === "/robots.txt" ||
    pathname === "/sitemap.xml" ||
    /\.(?:png|jpe?g|svg|webp|gif|ico)$/i.test(pathname);
}

function globalGatewayIsolation(request: NextRequest) {
  if (process.env.MMIPS_SITE_MODE !== "global") return null;

  const pathname = request.nextUrl.pathname;
  if (pathname === "/" || isCountryShellAsset(pathname)) return NextResponse.next();

  if (pathname.startsWith("/api/")) {
    return NextResponse.json(
      { error: "Choose a country-specific MMIPS system." },
      { status: 404, headers: { "Cache-Control": "no-store" } }
    );
  }

  const gatewayUrl = request.nextUrl.clone();
  gatewayUrl.pathname = "/";
  gatewayUrl.search = "";
  return NextResponse.redirect(gatewayUrl, 307);
}

function canadaPublicRouteAllowed(pathname: string) {
  if (pathname === "/" || pathname === "/profiles" || pathname === "/resources" || pathname === "/how-it-works" || pathname === "/submit" || pathname === "/privacy") return true;
  if (pathname.startsWith("/profiles/")) return true;
  return isCountryShellAsset(pathname);
}

function canadaPublicApiAllowed(pathname: string) {
  return pathname === "/api/profiles/map" || pathname === "/api/profiles/search";
}

function canadaCountryIsolation(request: NextRequest) {
  if (process.env.MMIPS_SITE_MODE !== "ca") return null;

  const pathname = request.nextUrl.pathname;
  if (canadaPublicRouteAllowed(pathname)) return NextResponse.next();
  if (canadaPublicApiAllowed(pathname)) return NextResponse.next();

  if (pathname.startsWith("/api/")) {
    return NextResponse.json(
      { error: "This API is not enabled for MMIPS Canada." },
      { status: 404, headers: { "Cache-Control": "no-store" } }
    );
  }

  const canadaHome = request.nextUrl.clone();
  canadaHome.pathname = "/";
  canadaHome.search = "";
  return NextResponse.redirect(canadaHome, 307);
}

export function proxy(request: NextRequest) {
  const globalResponse = globalGatewayIsolation(request);
  if (globalResponse) return globalResponse;

  const canadaResponse = canadaCountryIsolation(request);
  if (canadaResponse) return canadaResponse;

  if (!request.nextUrl.pathname.startsWith("/admin")) return NextResponse.next();

  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const csp = adminContentSecurityPolicy(nonce);
  const requestHeaders = new Headers(request.headers);

  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", csp);

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set("Content-Security-Policy", csp);
  response.headers.set("Cache-Control", "no-store, private");
  return response;
}

export const config = {
  matcher: [
    {
      source: "/admin/:path*",
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" }
      ]
    },
    { source: "/:path*" }
  ]
};
