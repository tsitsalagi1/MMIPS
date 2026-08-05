type TurnstileResponse = {
  success: boolean;
  "error-codes"?: string[];
  hostname?: string;
  challenge_ts?: string;
  action?: string;
};

export function clientIpFromRequest(request: Request) {
  return (
    request.headers.get("CF-Connecting-IP") ||
    request.headers.get("X-Forwarded-For")?.split(",")[0]?.trim() ||
    null
  );
}

export async function verifyTurnstileToken(token: FormDataEntryValue | null, request: Request) {
  const secret = process.env.TURNSTILE_SECRET_KEY;

  // Until Turnstile is configured, do not break local/dev testing.
  // Public launch should set TURNSTILE_SECRET_KEY so submissions require verification.
  if (!secret) {
    return { ok: true, skipped: true as const };
  }

  const response = typeof token === "string" ? token.trim() : "";
  if (!response) {
    return { ok: false, message: "Verification is required. Please complete the anti-spam check." };
  }

  const formData = new FormData();
  formData.append("secret", secret);
  formData.append("response", response);
  const ip = clientIpFromRequest(request);
  if (ip) formData.append("remoteip", ip);

  try {
    const result = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      body: formData
    });

    const json = (await result.json()) as TurnstileResponse;
    if (!json.success) {
      console.error("Turnstile verification failed.", { code: "turnstile_rejected" });
      return {
        ok: false,
        message: "Verification failed. Please try again."
      };
    }

    return { ok: true, skipped: false as const };
  } catch {
    console.error("Turnstile validation error", { code: "turnstile_validation_exception" });
    return { ok: false, message: "Verification failed. Please try again." };
  }
}
