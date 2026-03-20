const BLUELYTICS_URL = "https://api.bluelytics.com.ar/v2/latest";

interface BluelyticsData {
  blue: {
    value_avg: number;
    value_sell: number;
    value_buy: number;
  };
}

export async function getBlueDollarRate(): Promise<number | null> {
  try {
    const res = await fetch(BLUELYTICS_URL, {
      next: { revalidate: 3600 },
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

export function calculateSubscriptionPrice(usdPrice: number): number {
  return usdPrice * 1435;
}
