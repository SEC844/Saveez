import { RateLimiterMemory } from "rate-limiter-flexible";

// 5 attempts per 15 minutes per IP
const rateLimiter = new RateLimiterMemory({
  points: 5,
  duration: 15 * 60, // seconds
});

export async function checkRateLimit(ip: string): Promise<void> {
  await rateLimiter.consume(ip);
}

export type RateLimitError = {
  remainingPoints: number;
  msBeforeNext: number;
};
