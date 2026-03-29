const requests = new Map<string, number[]>();

const MAX_REQUESTS = 20;
const WINDOW_MS = 60_000;

export function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const timestamps = requests.get(userId) || [];
  const recent = timestamps.filter((t) => now - t < WINDOW_MS);

  if (recent.length >= MAX_REQUESTS) {
    requests.set(userId, recent);
    return false;
  }

  recent.push(now);
  requests.set(userId, recent);
  return true;
}
