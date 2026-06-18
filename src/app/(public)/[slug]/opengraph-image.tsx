import { ImageResponse } from "next/og";
import { getBusinessBySlug } from "@/server/supabase-store/helpers";

export const alt = "Página pública del negocio";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

type Props = { params: Promise<{ slug: string }> };

export default async function Image({ params }: Props) {
  const { slug } = await params;

  let businessName = "ReservaYa";
  try {
    const business = await getBusinessBySlug(slug);
    businessName = business.name;
  } catch {
    // fallback al nombre de la marca
  }

  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 64,
          background: "linear-gradient(to bottom right, #0F172A, #1E293B)",
          color: "#F8FAFC",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: 48,
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div style={{ fontSize: 96, fontWeight: 700, textAlign: "center" }}>
          {businessName}
        </div>
        <div style={{ marginTop: 24, fontSize: 36, opacity: 0.85, textAlign: "center" }}>
          Reservá tu turno online
        </div>
      </div>
    ),
    { ...size }
  );
}
