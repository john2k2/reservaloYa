// Rate limiting simple por userId para exports CSV.
// Límite: 10 exports por ventana de 60 segundos por usuario.
// En Vercel Fluid Compute, las instancias persisten entre requests
// del mismo usuario — suficiente para prevenir abuso.

const WINDOW_MS = 60_000;
const MAX_REQUESTS = 10;

const requestLog = new Map<string, number[]>();

export function checkExportRateLimit(userId: string): { allowed: boolean; retryAfterMs: number } {
  const now = Date.now();
  const windowStart = now - WINDOW_MS;

  const timestamps = (requestLog.get(userId) ?? []).filter((t) => t > windowStart);

  if (timestamps.length >= MAX_REQUESTS) {
    const oldest = timestamps[0];
    return { allowed: false, retryAfterMs: oldest + WINDOW_MS - now };
  }

  timestamps.push(now);
  requestLog.set(userId, timestamps);
  return { allowed: true, retryAfterMs: 0 };
}
