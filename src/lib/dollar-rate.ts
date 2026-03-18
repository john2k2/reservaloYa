const BLUELYICS_URL = "https://api.bluelytics.com.ar/v2/latest";

interface DollarRate {
  blue: {
    value_avg: number;
    value_sell: number;
    value_buy: number;
  };
  oficial: {
    value_avg: number;
  };
}

export async function getBlueDollarRate(): Promise<number | null> {
  try {
    const res = await fetch(BLUELYICS_URL, {
      next: { revalidate: 86400 }, // cache 24 hours
    });

    if (!res.ok) {
      return null;
    }

    const data: DollarRate = await res.json();
    return Math.round(data.blue.value_sell); // blue venta
  } catch {
    return null;
  }
}

export function calculateSubscriptionPrice(usdPrice: number): number {
  return usdPrice * 1450; // fallback to ~1450 ARS if can't get blue rate
}
