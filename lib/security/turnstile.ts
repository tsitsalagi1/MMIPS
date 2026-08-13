import { consumeDistributedRateLimit } from "./rate-limit";

type TurnstileResponse = { success: boolean; hostname?: string; action?: string; "error-codes"?: string[] };
type TurnstileOptions = { expectedAction?: string; expectedHostname?: string; fetcher?: typeof fetch };

export function clientIpFromRequest(request: Request) {
  return request.headers.get("CF-Connecting-IP") || request.headers.get("X-Forwarded-For")?.split(",")[0]?.trim() || null;
}

export function expectedTurnstileHostname(request: Request) {
  const requestHostname = new URL(request.url).hostname.toLowerCase();
  if (["mmips.com", "www.mmips.com", "us.mmips.com", "ca.mmips.com"].includes(requestHostname)) return requestHostname;
  const configured = process.env.TURNSTILE_EXPECTED_HOSTNAME?.trim().toLowerCase();
  return configured || undefined;
}

export async function verifyTurnstileToken(token: FormDataEntryValue | null, request: Request, options: TurnstileOptions = {}) {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  const bypass = process.env.NODE_ENV !== "production" && process.env.ALLOW_INSECURE_TURNSTILE_BYPASS === "true";
  if (!secret) {
    console.warn("MMIPS Turnstile verification unavailable.", { code: "turnstile_secret_missing" });
    return bypass ? { ok: true, skipped: true as const } : { ok: false, message: "Verification is unavailable." };
  }
  if (process.env.NODE_ENV === "production" && options.expectedAction && !options.expectedHostname) {
    console.warn("MMIPS Turnstile verification unavailable.", { code: "turnstile_expected_hostname_missing", action: options.expectedAction });
    return { ok: false, message: "Verification is unavailable." };
  }
  const responseToken = typeof token === "string" ? token.trim() : "";
  if (!responseToken || responseToken.length > 2048) {
    console.warn("MMIPS Turnstile token rejected before validation.", { code: "turnstile_token_missing_or_invalid_length" });
    return { ok: false, message: "Verification is required." };
  }
  const formData = new FormData();
  formData.append("secret", secret);
  formData.append("response", responseToken);
  // MMIPS deliberately does not transmit the optional visitor IP to Turnstile.
  const controller = new AbortController(), timeout = setTimeout(() => controller.abort(), 5000);
  try {
    const result = await (options.fetcher ?? fetch)("https://challenges.cloudflare.com/turnstile/v0/siteverify", { method: "POST", body: formData, signal: controller.signal });
    const json = await result.json() as TurnstileResponse;
    if (!result.ok) {
      console.warn("MMIPS Turnstile Siteverify request failed.", { code: "turnstile_siteverify_non_2xx", status: result.status });
      return { ok: false, message: "Verification failed." };
    }
    if (!json.success) {
      console.warn("MMIPS Turnstile token rejected by Siteverify.", { code: "turnstile_siteverify_rejected", errorCodes: Array.isArray(json["error-codes"]) ? json["error-codes"].slice(0, 5) : [] });
      return { ok: false, message: "Verification failed." };
    }
    if (options.expectedAction && json.action !== options.expectedAction) {
      console.warn("MMIPS Turnstile action mismatch.", { code: "turnstile_action_mismatch", expectedAction: options.expectedAction, actualAction: json.action || null });
      return { ok: false, message: "Verification failed." };
    }
    if (options.expectedHostname && json.hostname !== options.expectedHostname) {
      console.warn("MMIPS Turnstile hostname mismatch.", { code: "turnstile_hostname_mismatch", expectedHostname: options.expectedHostname, actualHostname: json.hostname || null });
      return { ok: false, message: "Verification failed." };
    }

    const ip = clientIpFromRequest(request);
    const hasRateLimitStore = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
    if (ip && hasRateLimitStore) {
      const pathScope = options.expectedAction || new URL(request.url).pathname.replace(/[^a-z0-9/_-]/gi, "").slice(0, 60) || "public-form";
      const allowed = await consumeDistributedRateLimit({ scope: `turnstile-ip:${pathScope}`, identifier: ip, limit: 30, windowSeconds: 3600 });
      if (!allowed) {
        console.warn("MMIPS Turnstile request rate limited.", { code: "turnstile_rate_limited", scope: pathScope });
        return { ok: false, message: "Verification failed." };
      }
    }
    return { ok: true, skipped: false as const };
  } catch (error) {
    console.warn("MMIPS Turnstile verification exception.", { code: "turnstile_siteverify_exception", name: error instanceof Error ? error.name : "unknown" });
    return { ok: false, message: "Verification failed." };
  } finally {
    clearTimeout(timeout);
  }
}
