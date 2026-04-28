import { createAdminClient } from "@/lib/supabase/server";

const BLUELYTICS_URL = "https://api.bluelytics.com.ar/v2/latest";
const DOLARAPI_URL = "https://dolarapi.com/v1/dolares/blue";
const FETCH_TIMEOUT_MS = 3000;
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hora

interface DollarRateCache {
  rate: number;
  fetchedAt: number;
  source: string;
}

// Cache en memoria del servidor. En Vercel serverless se pierde entre
// cold starts, pero se reconstruye desde Supabase o las APIs.
let memoryCache: DollarRateCache | null = null;

async function fetchWithTimeout(
  url: string,
  timeoutMs: number
): Promise<Response | null> {
  try {
    const signal =
      typeof AbortSignal.timeout === "function"
        ? AbortSignal.timeout(timeoutMs)
        : undefined;

    const res = await fetch(url, {
      signal,
      cache: "no-store",
    });

    return res.ok ? res : null;
  } catch {
    return null;
  }
}

async function fetchFromBluelytics(): Promise<number | null> {
  const res = await fetchWithTimeout(BLUELYTICS_URL, FETCH_TIMEOUT_MS);
  if (!res) return null;

  try {
    const data = (await res.json()) as {
      blue?: { value_sell?: number };
    };
    const rate = data.blue?.value_sell;
    return rate && rate > 0 ? Math.round(rate) : null;
  } catch {
    return null;
  }
}

async function fetchFromDolarApi(): Promise<number | null> {
  const res = await fetchWithTimeout(DOLARAPI_URL, FETCH_TIMEOUT_MS);
  if (!res) return null;

  try {
    const data = (await res.json()) as { venta?: number };
    const rate = data.venta;
    return rate && rate > 0 ? Math.round(rate) : null;
  } catch {
    return null;
  }
}

/**
 * Lee el último rate conocido desde Supabase.
 * Usa service role para evitar problemas de RLS.
 */
async function getPersistedRate(): Promise<DollarRateCache | null> {
  try {
    const client = createAdminClient();
    const { data, error } = await client
      .from("app_config")
      .select("value, updated_at")
      .eq("key", "last_blue_rate")
      .single();

    if (error || !data) return null;

    const rate = Number(data.value);
    if (isNaN(rate) || rate <= 0) return null;

    return {
      rate,
      fetchedAt: new Date(data.updated_at).getTime(),
      source: "supabase",
    };
  } catch {
    return null;
  }
}

/**
 * Guarda el rate en Supabase para persistir entre deploys.
 */
async function persistRate(rate: number, source: string): Promise<void> {
  try {
    const client = createAdminClient();
    await client
      .from("app_config")
      .upsert(
        {
          key: "last_blue_rate",
          value: String(rate),
          updated_at: new Date().toISOString(),
        },
        { onConflict: "key" }
      );
  } catch (err) {
    console.warn("[DollarRate] No se pudo persistir el rate en Supabase:", err);
  }
}

/**
 * Obtiene el tipo de cambio dólar blue.
 *
 * Estrategia:
 * 1. Si el cache en memoria tiene < 1 hora, lo devuelve.
 * 2. Intenta Bluelytics → si funciona, actualiza memoria + Supabase.
 * 3. Si falla, intenta DolarAPI → si funciona, actualiza memoria + Supabase.
 * 4. Si ambas fallan, lee el último valor de Supabase.
 * 5. Si Supabase tampoco tiene nada, devuelve null.
 *
 * El valor persistido en Supabase actúa como fallback dinámico:
 * siempre es el último rate real que se obtuvo, nunca un hardcode.
 */
export async function getBlueDollarRate(): Promise<number | null> {
  const now = Date.now();

  // 1. Cache en memoria válido (< 1 hora)
  if (memoryCache && now - memoryCache.fetchedAt < CACHE_TTL_MS) {
    return memoryCache.rate;
  }

  // 2. Intentar Bluelytics
  const bluelyticsRate = await fetchFromBluelytics();
  if (bluelyticsRate) {
    memoryCache = { rate: bluelyticsRate, fetchedAt: now, source: "bluelytics" };
    await persistRate(bluelyticsRate, "bluelytics");
    return bluelyticsRate;
  }

  // 3. Fallback a DolarAPI
  const dolarApiRate = await fetchFromDolarApi();
  if (dolarApiRate) {
    memoryCache = { rate: dolarApiRate, fetchedAt: now, source: "dolarapi" };
    await persistRate(dolarApiRate, "dolarapi");
    return dolarApiRate;
  }

  // 4. Leer último valor de Supabase
  const persisted = await getPersistedRate();
  if (persisted) {
    console.warn(
      `[DollarRate] Ambas APIs fallaron. Usando valor persistido en Supabase de ${
        Math.round((now - persisted.fetchedAt) / 60000)
      } minutos atrás)`
    );
    // Actualizamos memoria para no volver a leer Supabase en la próxima request
    memoryCache = persisted;
    return persisted.rate;
  }

  // 5. Nunca tuvimos datos
  console.error("[DollarRate] No se pudo obtener el tipo de cambio y no hay datos persistidos");
  return null;
}

/**
 * Fuerza una actualización del cache. Útil para testing.
 */
export async function refreshBlueDollarRate(): Promise<number | null> {
  memoryCache = null;
  return getBlueDollarRate();
}

/**
 * Limpia el cache en memoria sin hacer fetch.
 * Útil para tests que necesitan un estado limpio.
 */
export function clearDollarRateCache(): void {
  memoryCache = null;
}

/**
 * Devuelve el estado actual del cache (para debugging).
 */
export function getDollarRateCacheStatus(): DollarRateCache | null {
  return memoryCache;
}