export type BillingTransferDetails = {
  alias: string | null;
  cbu: string | null;
  holder: string | null;
  bank: string | null;
};

export function getBillingTransferDetails(): BillingTransferDetails {
  return {
    alias: process.env.BILLING_TRANSFER_ALIAS?.trim() || null,
    cbu: process.env.BILLING_TRANSFER_CBU?.trim() || null,
    holder: process.env.BILLING_TRANSFER_HOLDER?.trim() || null,
    bank: process.env.BILLING_TRANSFER_BANK?.trim() || null,
  };
}

export function hasBillingTransferDetails(details: BillingTransferDetails = getBillingTransferDetails()) {
  return Boolean(details.alias || details.cbu);
}

export function buildTransferWhatsAppMessage(input: {
  businessName: string;
  amountArsLabel?: string;
}) {
  const amountPart = input.amountArsLabel ? ` por $${input.amountArsLabel} ARS` : "";
  return `Hola, soy de ${input.businessName}. Te envío el comprobante de transferencia${amountPart} para activar ReservaYa.`;
}
