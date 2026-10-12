// In-memory rate limits: a token bucket per visitor and a daily cap on model calls.
// Each server instance keeps its own counts, which is enough for a demo. On Cloudflare a
// rate-limiting binding (env.RATE_LIMITER) can be added in front of this.

const DAY_MS = 86_400_000;

export function createRateLimiter({
  perMinute = 20,
  burst = 8,
  dailyCap = 1500,
  maxKeys = 5000,
  now = () => Date.now(),
} = {}) {
  const buckets = new Map();
  const refillPerMs = perMinute / 60_000;
  let day = Math.floor(now() / DAY_MS);
  let dayCount = 0;

  function take(key) {
    const t = now();
    let b = buckets.get(key);
    if (b) {
      b.tokens = Math.min(burst, b.tokens + (t - b.at) * refillPerMs);
      b.at = t;
      buckets.delete(key); // re-insert so Map order stays least-recently-used first
    } else {
      if (buckets.size >= maxKeys) buckets.delete(buckets.keys().next().value);
      b = { tokens: burst, at: t };
    }
    buckets.set(key, b);
    if (b.tokens >= 1) {
      b.tokens -= 1;
      return { ok: true };
    }
    return { ok: false, retryAfter: Math.max(1, Math.ceil((1 - b.tokens) / refillPerMs / 1000)) };
  }

  function takeDaily() {
    const t = now();
    const d = Math.floor(t / DAY_MS);
    if (d !== day) {
      day = d;
      dayCount = 0;
    }
    if (dayCount >= dailyCap) {
      return { ok: false, retryAfter: Math.ceil(((d + 1) * DAY_MS - t) / 1000) };
    }
    dayCount += 1;
    return { ok: true, remaining: dailyCap - dayCount };
  }

  return { take, takeDaily, size: () => buckets.size };
}

export function limiterFromEnv(env = {}) {
  const num = (v, d) => (Number.isFinite(Number(v)) && Number(v) > 0 ? Number(v) : d);
  return createRateLimiter({
    perMinute: num(env.RATE_LIMIT_PER_MIN, 20),
    burst: num(env.RATE_LIMIT_BURST, 8),
    dailyCap: num(env.DAILY_MODEL_CALLS, 1500),
  });
}
