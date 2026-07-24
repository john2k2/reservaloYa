/**
 * Helpers para transformar datos crudos del negocio (servicios, horarios,
 * dirección) en labels listos para mostrar en la página pública.
 */

type PricedService = {
  price: number;
  priceLabel: string;
};

/** Filtra servicios con precio numérico y label ya formateado (excluye "a consultar"). */
export function filterPricedServices(
  services: Array<{
    priceLabel?: string;
    price?: number | null;
  }>
): PricedService[] {
  return services.filter(
    (service): service is PricedService =>
      typeof service.price === "number" && Boolean(service.priceLabel)
  );
}

export function getStartingPriceLabel(pricedServices: PricedService[]) {
  if (pricedServices.length === 0) {
    return "Consulta personalizada";
  }

  const cheapestService = pricedServices.reduce((currentCheapest, service) =>
    service.price < currentCheapest.price ? service : currentCheapest
  );

  return `Desde ${cheapestService.priceLabel}`;
}

/**
 * schema.org priceRange for LocalBusiness. Uses the real ARS min–max range from
 * priced services rather than symbolic "$$" tiers, whose absolute thresholds age
 * badly under Argentine inflation. Returns undefined when no service is priced.
 */
export function getPriceRangeSymbol(pricedServices: PricedService[]): string | undefined {
  if (pricedServices.length === 0) {
    return undefined;
  }

  const sorted = [...pricedServices].sort((a, b) => a.price - b.price);
  const cheapest = sorted[0];
  const priciest = sorted[sorted.length - 1];

  return cheapest.price === priciest.price
    ? cheapest.priceLabel
    : `${cheapest.priceLabel} - ${priciest.priceLabel}`;
}

export function getFirstActiveDayLabel(
  weeklyHours: Array<{
    dayLabel: string;
    hoursLabel: string;
  }>
) {
  return (
    weeklyHours.find((slot) => !slot.hoursLabel.toLocaleLowerCase("es-AR").includes("cerrado")) ??
    weeklyHours[0] ??
    null
  );
}

export function getShortAddressLabel(address?: string | null) {
  if (!address) {
    return "Ubicación a confirmar";
  }

  const [firstSegment] = address.split(",");
  return firstSegment?.trim() || address;
}

export function getNextAvailableSlotLabel(input?: {
  dayLabel: string;
  hoursLabel: string;
} | null) {
  if (!input) {
    return {
      title: "Agenda activa",
      detail: "Ver disponibilidad",
    };
  }

  return {
    title: input.dayLabel,
    detail: input.hoursLabel,
  };
}
