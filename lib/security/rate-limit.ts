import { createClient } from "@supabase/supabase-js";

type RateLimitInput = {
  scope: string;
  identifier: string | null | undefined;
  limit: number;
  windowSeconds: number;
};

function rateLimitClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  return url && key ? createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } }) : null;
}

export async function consumeDistributedRateLimit(input: RateLimitInput) {
  const identifier = typeof input.identifier === "string" ? input.identifier.trim().toLowerCase().slice(0, 500) : "";
  if (!identifier) return false;
  const client = rateLimitClient();
  if (!client) return process.env.NODE_ENV !== "production";

  try {
    const { data, error } = await client.rpc("mmips_consume_rate_limit", {
      p_scope: input.scope.slice(0, 80),
      p_identifier: identifier,
      p_limit: input.limit,
      p_window_seconds: input.windowSeconds
    });
    if (error) {
      console.error("MMIPS distributed rate limit unavailable.", { code: "rate_limit_rpc_failed", scope: input.scope });
      return false;
    }
    return data === true;
  } catch {
    console.error("MMIPS distributed rate limit unavailable.", { code: "rate_limit_rpc_exception", scope: input.scope });
    return false;
  }
}
