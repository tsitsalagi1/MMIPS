type RateLimitRpcClient = {
  rpc(name: string, args: Record<string, unknown>): PromiseLike<{ data: unknown; error: unknown }>;
};

type RateLimitInput = {
  scope: string;
  identifier: string | null | undefined;
  limit: number;
  windowSeconds: number;
};

export async function consumeDistributedRateLimit(client: RateLimitRpcClient, input: RateLimitInput) {
  const identifier = typeof input.identifier === "string" ? input.identifier.trim().toLowerCase().slice(0, 500) : "";
  if (!identifier) return false;

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
