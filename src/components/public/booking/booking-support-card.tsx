import { MessageSquareMore } from "lucide-react";

import { WhatsAppIcon } from "@/components/icons";
import { buttonVariants } from "@/components/ui/button-variants";
import { cn } from "@/lib/utils";

type BookingSupportCardProps = {
  whatsappHref: string;
};

export function BookingSupportCard({ whatsappHref }: BookingSupportCardProps) {
  return (
    <section className="rounded-[1.75rem] border border-border/70 bg-card/95 p-5 shadow-sm sm:p-6">
      <div className="inline-flex size-11 items-center justify-center rounded-2xl bg-secondary text-foreground">
        <MessageSquareMore className="size-5" />
      </div>
      <p className="mt-4 text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
        ¿Necesitás ayuda?
      </p>
      <h3 className="mt-2 text-lg font-semibold text-foreground">
        Solo para errores o urgencias reales.
      </h3>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">
        Si hay un problema con la página o un inconveniente real, usá este canal. Los horarios
        visibles son los únicos disponibles.
      </p>
      <a
        href={whatsappHref}
        target="_blank"
        rel="noopener noreferrer"
        className={cn(
          buttonVariants({ variant: "outline", size: "lg" }),
          "mt-5 inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl font-semibold transition-all duration-200 hover:bg-secondary"
        )}
      >
        <WhatsAppIcon className="size-4" />
        Reportar un problema
      </a>
    </section>
  );
}
