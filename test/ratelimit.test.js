import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRateLimiter, limiterFromEnv } from '../src/ratelimit.js';

test('burst, then refill at the per-minute rate', () => {
  let t = 1_000_000;
  const rl = createRateLimiter({ perMinute: 60, burst: 3, now: () => t });
  assert.ok(rl.take('a').ok);
  assert.ok(rl.take('a').ok);
  assert.ok(rl.take('a').ok);
  const blocked = rl.take('a');
  assert.equal(blocked.ok, false);
  assert.equal(blocked.retryAfter, 1);
  t += 1000;
  assert.ok(rl.take('a').ok);
});

test('visitors have separate buckets', () => {
  const rl = createRateLimiter({ perMinute: 1, burst: 1, now: () => 0 });
  assert.ok(rl.take('a').ok);
  assert.equal(rl.take('a').ok, false);
  assert.ok(rl.take('b').ok);
});

test('the bucket map is bounded', () => {
  const rl = createRateLimiter({ maxKeys: 3, now: () => 0 });
  for (const k of ['a', 'b', 'c', 'd', 'e']) rl.take(k);
  assert.equal(rl.size(), 3);
});

test('daily cap resets at UTC midnight', () => {
  let t = Date.UTC(2026, 9, 10, 23, 59, 0);
  const rl = createRateLimiter({ dailyCap: 2, now: () => t });
  assert.ok(rl.takeDaily().ok);
  assert.ok(rl.takeDaily().ok);
  const capped = rl.takeDaily();
  assert.equal(capped.ok, false);
  assert.equal(capped.retryAfter, 60);
  t = Date.UTC(2026, 9, 11, 0, 0, 1);
  assert.ok(rl.takeDaily().ok);
});

test('env values that are not positive numbers fall back to defaults', () => {
  const rl = limiterFromEnv({ RATE_LIMIT_PER_MIN: 'abc', RATE_LIMIT_BURST: '0' });
  for (let i = 0; i < 8; i++) assert.ok(rl.take('x').ok);
  assert.equal(rl.take('x').ok, false);
});
