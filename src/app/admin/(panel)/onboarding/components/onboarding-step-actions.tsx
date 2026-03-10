import { ChevronLeft, ChevronRight, CheckCircle2 } from "lucide-react";

import { buttonVariants } from "@/components/ui/button-variants";
import { cn } from "@/lib/utils";

type OnboardingStepActionsProps = {
  onBack?: () => void;
  onNext?: () => void;
  onPrimary: () => void;
  primaryLabel: string;
  isSubmitting?: boolean;
  primaryDisabled?: boolean;
  nextLabel?: string;
  showSaveIcon?: boolean;
};

export function OnboardingStepActions({
  onBack,
  onNext,
  onPrimary,
  primaryLabel,
  isSubmitting = false,
  primaryDisabled = false,
  nextLabel = "Continuar",
  showSaveIcon = false,
}: OnboardingStepActionsProps) {
  return (
    <div className="flex items-center justify-between">
      <div>
        {onBack ? (
          <button onClick={onBack} className={cn(buttonVariants({ variant: "outline", size: "lg" }), "h-11")}>
            <ChevronLeft className="mr-1 size-4" />
            Atras
          </button>
        ) : null}
      </div>

      <div className="flex gap-3">
        {onNext ? (
          <button onClick={onNext} className={cn(buttonVariants({ variant: "outline", size: "lg" }), "h-11")}>
            {nextLabel}
            <ChevronRight className="ml-1 size-4" />
          </button>
        ) : null}
        <button
          onClick={onPrimary}
          disabled={primaryDisabled || isSubmitting}
          className={cn(
            buttonVariants({ variant: "default", size: "lg" }),
            "h-11",
            (primaryDisabled || isSubmitting) && "cursor-not-allowed opacity-50"
          )}
        >
          {primaryLabel}
          {showSaveIcon ? <CheckCircle2 className="ml-1.5 size-4" /> : <ChevronRight className="ml-1 size-4" />}
        </button>
      </div>
    </div>
  );
}
