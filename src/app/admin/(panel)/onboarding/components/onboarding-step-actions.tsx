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
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="w-full sm:w-auto">
        {onBack ? (
          <button
            onClick={onBack}
            className={cn(
              buttonVariants({ variant: "outline", size: "lg" }),
              "h-11 w-full sm:w-auto"
            )}
          >
            <ChevronLeft className="mr-1 size-4" />
            Atrás
          </button>
        ) : null}
      </div>

      <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
        {onNext ? (
          <button
            onClick={onNext}
            className={cn(
              buttonVariants({ variant: "outline", size: "lg" }),
              "h-11 w-full sm:w-auto"
            )}
          >
            {nextLabel}
            <ChevronRight className="ml-1 size-4" />
          </button>
        ) : null}
        <button
          onClick={onPrimary}
          disabled={primaryDisabled || isSubmitting}
          className={cn(
            buttonVariants({ variant: "default", size: "lg" }),
            "h-11 w-full sm:w-auto",
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
