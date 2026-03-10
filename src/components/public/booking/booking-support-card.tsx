import { WhatsAppIcon } from "@/components/icons";
import { buttonVariants } from "@/components/ui/button-variants";
import { cn } from "@/lib/utils";

type BookingSupportCardProps = {
  whatsappHref: string;
};

export function BookingSupportCard({ whatsappHref }: BookingSupportCardProps) {
  return (
    <div className="mt-12 rounded-2xl border border-border/70 bg-secondary/30 p-6 text-center">
      <p className="text-sm font-medium text-foreground">¿Tienes dudas sobre tu reserva?</p>
      <p className="mt-1 text-xs text-muted-foreground">
        Escríbenos por WhatsApp y te ayudamos
      </p>
      <a
        href={whatsappHref}
        target="_blank"
        rel="noopener noreferrer"
        className={cn(
          buttonVariants({ variant: "outline", size: "default" }),
          "mt-4 inline-flex h-11 items-center gap-2 rounded-full px-6 text-sm font-semibold transition-all duration-200 hover:bg-secondary hover:scale-105 active:scale-95"
        )}
      >
        <WhatsAppIcon className="size-4" />
        Contactar por WhatsApp
      </a>
    </div>
  );
}
