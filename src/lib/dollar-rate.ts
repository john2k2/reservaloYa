const BLUELYTICS_URL = "https://api.bluelytics.com.ar/v2/latest";
const DOLLAR_RATE_TIMEOUT_MS = 3000;

interface BluelyticsData {
  blue: {
    value_avg: number;
    value_sell: number;
    value_buy: number;
  };
}

export async function getBlueDollarRate(): Promise<number | null> {
  try {
    const timeoutSignal =
      typeof AbortSignal.timeout === "function"
        ? AbortSignal.timeout(DOLLAR_RATE_TIMEOUT_MS)
        : undefined;

    const res = await fetch(BLUELYTICS_URL, {
      next: { revalidate: 3600 },
      signal: timeoutSignal,
    });

    if (!res.ok) {
      return null;
    }

    const data: BluelyticsData = await res.json();
    return Math.round(data.blue.value_sell);
  } catch {
    return null;
  }
}
