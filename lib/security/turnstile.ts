import { consumeDistributedRateLimit } from "./rate-limit";

type TurnstileResponse = { success: boolean; hostname?: string; action?: string };
type TurnstileOptions = { expectedAction?: string; expectedHostname?: string; fetcher?: typeof fetch };

export function clientIpFromRequest(request: Request) {
  return request.headers.get("CF-Connecting-IP") || request.headers.get("X-Forwarded-For")?.split(",")[0]?.trim() || null;
}

export async function verifyTurnstileToken(token: FormDataEntryValue | null, request: Request, options: TurnstileOptions = {}) {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  const bypass = process.env.NODE_ENV !== "production" && process.env.ALLOW_INSECURE_TURNSTILE_BYPASS === "true";
  if (!secret) return bypass ? { ok: true, skipped: true as const } : { ok: false, message: "Verification is unavailable." };
  if (process.env.NODE_ENV === "production" && options.expectedAction && !options.expectedHostname) return { ok: false, message: "Verification is unavailable." };
  const responseToken = typeof token === "string" ? token.trim() : "";
  if (!responseToken || responseToken.length > 2048) return { ok: false, message: "Verification is required." };
  const formData = new FormData();
  formData.append("secret", secret);
  formData.append("response", responseToken);
  // MMIPS deliberately does not transmit the optional visitor IP to Turnstile.
  const controller = new AbortController(), timeout = setTimeout(() => controller.abort(), 5000);
  try {
    const result = await (options.fetcher ?? fetch)("https://challenges.cloudflare.com/turnstile/v0/siteverify", { method: "POST", body: formData, signal: controller.signal });
    const json = await result.json() as TurnstileResponse;
    if (!result.ok || !json.success || (options.expectedAction && json.action !== options.expectedAction) || (options.expectedHostname && json.hostname !== options.expectedHostname)) return { ok: false, message: "Verification failed." };

    const ip = clientIpFromRequest(request);
    const hasRateLimitStore = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
    if (ip && hasRateLimitStore) {
      const pathScope = options.expectedAction || new URL(request.url).pathname.replace(/[^a-z0-9/_-]/gi, "").slice(0, 60) || "public-form";
      const allowed = await consumeDistributedRateLimit({ scope: `turnstile-ip:${pathScope}`, identifier: ip, limit: 30, windowSeconds: 3600 });
      if (!allowed) return { ok: false, message: "Verification failed." };
    }
    return { ok: true, skipped: false as const };
  } catch {
    return { ok: false, message: "Verification failed." };
  } finally {
    clearTimeout(timeout);
  }
}
