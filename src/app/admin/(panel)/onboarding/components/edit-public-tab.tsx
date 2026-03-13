import type { Dispatch, SetStateAction } from "react";

import { Globe } from "lucide-react";

import { FormField } from "./form-field";

type PublicData = {
  instagram: string;
  facebook: string;
  tiktok: string;
  website: string;
  mapQuery: string;
};

type EditPublicTabProps = {
  publicData: PublicData;
  setPublicData: Dispatch<SetStateAction<PublicData>>;
};

export function EditPublicTab({ publicData, setPublicData }: EditPublicTabProps) {
  return (
    <article className="rounded-3xl border border-border/60 bg-card p-8 shadow-sm">
      <div className="mb-8 flex items-start gap-3">
        <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl border border-border/60 bg-secondary/30">
          <Globe aria-hidden="true" className="size-5 text-foreground" />
        </div>
        <div>
          <h3 className="text-xl font-semibold text-card-foreground">Datos públicos</h3>
          <p className="mt-1 text-sm text-muted-foreground">Redes sociales y dirección para el mapa.</p>
        </div>
      </div>

      <div className="space-y-6">
        <div className="grid gap-6 sm:grid-cols-2">
          <FormField
            id="instagram"
            label="Instagram"
            placeholder="@tu.marca"
            value={publicData.instagram}
            onChange={(value) => setPublicData((d) => ({ ...d, instagram: value }))}
            hint="Sin @, solo el nombre de usuario"
          />

          <FormField
            id="facebook"
            label="Facebook"
            placeholder="tu.pagina"
            value={publicData.facebook}
            onChange={(value) => setPublicData((d) => ({ ...d, facebook: value }))}
            hint="Usuario o nombre de página"
          />
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          <FormField
            id="tiktok"
            label="TikTok"
            placeholder="@tu.marca"
            value={publicData.tiktok}
            onChange={(value) => setPublicData((d) => ({ ...d, tiktok: value }))}
            hint="Con o sin @"
          />

          <FormField
            id="website"
            label="Website (opcional)"
            type="url"
            placeholder="https://..."
            value={publicData.website}
            onChange={(value) => setPublicData((d) => ({ ...d, website: value }))}
            hint="Si tenes otro sitio web"
          />
        </div>

        <FormField
          id="mapQuery"
          label="Dirección para el mapa"
          placeholder="Ej: Honduras 4821, Palermo, Buenos Aires"
          value={publicData.mapQuery}
          onChange={(value) => setPublicData((d) => ({ ...d, mapQuery: value }))}
          hint="Esta dirección se usa para mostrar el mapa en tu página"
        />
      </div>
    </article>
  );
}
