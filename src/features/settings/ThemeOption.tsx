import type { ElementType } from "react";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export function ThemeOption({
  icon: Icon,
  label,
  active,
  onClick,
}: {
  icon: ElementType;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <Button
      type="button"
      variant="outline"
      onClick={onClick}
      className={cn(
        "h-auto min-h-12 justify-between rounded-xl px-4 py-3",
        active ? "border-primary/30 bg-primary/10 text-foreground" : "text-muted-foreground"
      )}
    >
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 shrink-0" />
        <span>{label}</span>
      </div>

      {active ? (
        <div className="flex items-center gap-1 text-xs font-medium text-primary">
          <Check className="h-4 w-4" />
          <span>Selected</span>
        </div>
      ) : null}
    </Button>
  );
}
