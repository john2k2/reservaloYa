"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export type StepStatus = "completed" | "current" | "pending";

export interface OnboardingStep {
  id: string;
  label: string;
  description: string;
  status: StepStatus;
}

interface OnboardingStepperProps {
  steps: OnboardingStep[];
  currentStep: number;
  onStepClick?: (stepIndex: number) => void;
  allowNavigation?: boolean;
}

export function OnboardingStepper({
  steps,
  currentStep,
  onStepClick,
  allowNavigation = false,
}: OnboardingStepperProps) {
  const completedSteps = steps.filter((s) => s.status === "completed").length;
  const progressPercent = (completedSteps / steps.length) * 100;

  return (
    <div className="w-full">
      {/* Barra de progreso */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Progreso
          </span>
          <span className="text-xs font-semibold text-foreground">
            {completedSteps} de {steps.length} pasos
          </span>
        </div>
        <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
          <div
            className="h-full bg-foreground transition-all duration-500 ease-out rounded-full"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Steps */}
      <div className="flex items-start gap-2">
        {steps.map((step, index) => {
          const isClickable = allowNavigation && step.status !== "pending";
          const isLast = index === steps.length - 1;

          return (
            <div key={step.id} className="flex items-center flex-1">
              <button
                type="button"
                onClick={() => isClickable && onStepClick?.(index)}
                disabled={!isClickable}
                className={cn(
                  "flex flex-col items-center text-center group",
                  isClickable && "cursor-pointer",
                  !isClickable && "cursor-default"
                )}
              >
                {/* Indicador circular */}
                <div
                  className={cn(
                    "size-10 rounded-full flex items-center justify-center border-2 transition-all duration-300",
                    step.status === "completed" &&
                      "bg-foreground border-foreground text-background",
                    step.status === "current" &&
                      "bg-background border-foreground text-foreground ring-2 ring-foreground/20",
                    step.status === "pending" &&
                      "bg-background border-border text-muted-foreground"
                  )}
                >
                  {step.status === "completed" ? (
                    <Check className="size-5" />
                  ) : (
                    <span className="text-sm font-semibold">{index + 1}</span>
                  )}
                </div>

                {/* Label */}
                <div className="mt-2 hidden sm:block">
                  <p
                    className={cn(
                      "text-xs font-medium transition-colors",
                      step.status === "current"
                        ? "text-foreground"
                        : "text-muted-foreground",
                      step.status === "completed" && "text-foreground"
                    )}
                  >
                    {step.label}
                  </p>
                  <p className="text-[10px] text-muted-foreground/70 mt-0.5 hidden lg:block">
                    {step.description}
                  </p>
                </div>
              </button>

              {/* Línea conectora */}
              {!isLast && (
                <div
                  className={cn(
                    "flex-1 h-0.5 mx-2 transition-all duration-500",
                    index < currentStep ? "bg-foreground" : "bg-border"
                  )}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
