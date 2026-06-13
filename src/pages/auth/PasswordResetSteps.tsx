import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

const steps = [
  { id: 1, label: "البريد" },
  { id: 2, label: "الرمز" },
  { id: 3, label: "كلمة المرور" },
] as const;

export default function PasswordResetSteps({ currentStep }: { currentStep: 1 | 2 | 3 }) {
  return (
    <div className="mb-6">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const isDone = step.id < currentStep;
          const isCurrent = step.id === currentStep;

          return (
            <div key={step.id} className="flex flex-1 items-center">
              <div className="flex flex-col items-center gap-2">
                <div
                  className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-full border text-sm font-semibold",
                    isDone && "border-primary bg-primary text-primary-foreground",
                    isCurrent && "border-primary text-primary",
                    !isDone && !isCurrent && "border-border text-muted-foreground"
                  )}
                >
                  {isDone ? <Check className="h-4 w-4" /> : step.id}
                </div>
                <span className="text-xs text-muted-foreground">{step.label}</span>
              </div>
              {index < steps.length - 1 && (
                <div
                  className={cn(
                    "mx-3 h-px flex-1 bg-border",
                    step.id < currentStep && "bg-primary"
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
