"use client";

import { useEffect, useState } from "react";
import { Download, QrCode as QrCodeIcon } from "lucide-react";
import QRCode from "qrcode";

type PublicLinkQrCardProps = {
  publicUrl: string;
  businessSlug: string;
};

export function PublicLinkQrCard({ publicUrl, businessSlug }: PublicLinkQrCardProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    QRCode.toDataURL(publicUrl, {
      width: 480,
      margin: 2,
      color: { dark: "#000000", light: "#ffffff" },
    })
      .then((dataUrl) => {
        if (!cancelled) setQrDataUrl(dataUrl);
      })
      .catch(() => {
        if (!cancelled) setQrDataUrl(null);
      });

    return () => {
      cancelled = true;
    };
  }, [publicUrl]);

  return (
    <article className="rounded-3xl border border-border/60 bg-card p-8 shadow-sm">
      <div className="mb-6 flex items-start gap-3">
        <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl border border-border/60 bg-secondary/30">
          <QrCodeIcon aria-hidden="true" className="size-5 text-foreground" />
        </div>
        <div>
          <h3 className="text-xl font-semibold text-card-foreground">Código QR</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Descargalo e imprimilo para pegar en el local. Al escanearlo, tus clientes entran
            directo a tu página de reservas.
          </p>
        </div>
      </div>

      <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center">
        <div className="flex size-40 shrink-0 items-center justify-center rounded-2xl border border-border/60 bg-white p-3">
          {qrDataUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={qrDataUrl} alt={`Código QR de ${publicUrl}`} className="size-full" />
          ) : (
            <div className="size-full animate-pulse rounded-xl bg-secondary/40" />
          )}
        </div>

        <div className="flex flex-col items-center gap-2 sm:items-start">
          <p className="break-all text-sm text-muted-foreground">{publicUrl}</p>
          <a
            href={qrDataUrl ?? undefined}
            download={`qr-${businessSlug}.png`}
            aria-disabled={!qrDataUrl}
            className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-secondary/30 px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-secondary/50 aria-disabled:pointer-events-none aria-disabled:opacity-50"
          >
            <Download aria-hidden="true" className="size-4" />
            Descargar QR
          </a>
        </div>
      </div>
    </article>
  );
}
