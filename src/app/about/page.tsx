import type { Metadata } from "next";

import { createPageMetadata } from "@/lib/seo/metadata";

export { default } from "../sobre-reservaya/page";

export const metadata: Metadata = createPageMetadata({
  title: "About ReservaYa para agendas online",
  description:
    "About ReservaYa: enfoque, confianza y operación del sistema de reservas online para negocios de servicios en Argentina que quieren ordenar turnos.",
  path: "/about",
});
