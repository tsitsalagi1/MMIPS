import { NextRequest, NextResponse } from "next/server";

const isDev = process.env.NODE_ENV === "development";
const supabaseOrigin = "https://borhgkrydfuqgabkhxsr.supabase.co";
const supabaseWebSocketOrigin = "wss://borhgkrydfuqgabkhxsr.supabase.co";

function adminContentSecurityPolicy(nonce: string) {
  return [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${isDev ? " 'unsafe-eval'" : ""} https://challenges.cloudflare.com`,
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

  // The global gateway intentionally has no country case/search/submission/admin API surface.
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

function canadaPrelaunchIsolation(request: NextRequest) {
  if (process.env.MMIPS_SITE_MODE !== "ca") return null;

  const pathname = request.nextUrl.pathname;
  if (pathname === "/" || isCountryShellAsset(pathname)) return NextResponse.next();

  // Canada has no live case database or intake surface yet. Never fall through to
  // the United States routes merely because both builds share a Git repository.
  if (pathname.startsWith("/api/")) {
    return NextResponse.json(
      { error: "MMIPS Canada is preparing and does not accept or expose case data yet." },
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

  const canadaResponse = canadaPrelaunchIsolation(request);
  if (canadaResponse) return canadaResponse;

  if (!request.nextUrl.pathname.startsWith("/admin")) return NextResponse.next();

  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const csp = adminContentSecurityPolicy(nonce);
  const requestHeaders = new Headers(request.headers);

  // Next.js reads the request CSP/x-nonce headers and applies the matching
  // nonce to framework and page scripts during dynamic rendering.
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
