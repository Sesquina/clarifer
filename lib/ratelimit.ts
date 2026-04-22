import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// Chat API: 20 requests per user per minute
export const chatLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(20, "1 m"),
  prefix: "rl:chat",
});

// Upload API: 10 requests per user per hour
export const uploadLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, "1 h"),
  prefix: "rl:upload",
});

// Family update: 10 requests per user per hour
export const familyUpdateLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, "1 h"),
  prefix: "rl:family-update",
});

// Login: 5 attempts per IP per 15 minutes
export const loginLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, "15 m"),
  prefix: "rl:login",
});

// Signup / account creation: 3 per IP per hour
export const signupLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(3, "1 h"),
  prefix: "rl:signup",
});

// Password reset: 3 per IP per hour
export const resetLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(3, "1 h"),
  prefix: "rl:reset",
});

// Summarize: 10 per user per hour
export const summarizeLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, "1 h"),
  prefix: "rl:summarize",
});

// AI document analysis: 10 per user per hour
export const analyzeLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, "1 h"),
  prefix: "rl:analyze",
});

// AI family update (streaming): 20 per user per hour
export const familyUpdateStreamLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(20, "1 h"),
  prefix: "rl:family-update-stream",
});

// AI trial summary (streaming): 30 per user per hour
export const trialSummaryLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(30, "1 h"),
  prefix: "rl:trial-summary",
});
