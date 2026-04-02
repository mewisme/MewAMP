import { CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function SetupStepChips({
  labels,
  step,
  columnsClassName = "grid grid-cols-2 gap-2 md:grid-cols-4 xl:grid-cols-7",
}: {
  labels: string[];
  step: number;
  columnsClassName?: string;
}) {
  return (
    <div className={columnsClassName}>
      {labels.map((label, index) => {
        const active = step === index;
        const done = index < step;

        return (
          <div
            key={label}
            className={cn(
              "flex items-center gap-2 rounded-xl border px-3 py-2 text-sm transition-all",
              active && "border-primary/30 bg-primary/10 text-foreground",
              done && "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
              !active && !done && "border-border/60 bg-muted/30 text-muted-foreground"
            )}
          >
            <div
              className={cn(
                "flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold",
                active && "bg-primary text-primary-foreground",
                done && "bg-emerald-600 text-white",
                !active && !done && "bg-background text-muted-foreground border"
              )}
            >
              {done ? <CheckCircle2 className="h-3.5 w-3.5" /> : index + 1}
            </div>
            <span className="truncate">{label}</span>
          </div>
        );
      })}
    </div>
  );
}
