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

// Family-update limiter — 3 per minute per user (AI generation is expensive)
const familyUpdateRequests = new Map<string, number[]>();
const FAMILY_UPDATE_MAX = 3;

export function checkFamilyUpdateLimit(userId: string): boolean {
  const now = Date.now();
  const timestamps = familyUpdateRequests.get(userId) || [];
  const recent = timestamps.filter((t) => now - t < WINDOW_MS);

  if (recent.length >= FAMILY_UPDATE_MAX) {
    familyUpdateRequests.set(userId, recent);
    return false;
  }

  recent.push(now);
  familyUpdateRequests.set(userId, recent);
  return true;
}
