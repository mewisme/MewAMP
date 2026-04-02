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
      size="sm"
      onClick={onClick}
      className={cn(
        "h-auto min-h-8 justify-between gap-2 py-2",
        active ? "border-primary/30 bg-primary/10 text-foreground" : "text-muted-foreground"
      )}
    >
      <div className="flex items-center gap-1.5">
        <Icon className="size-3.5 shrink-0" />
        <span className="text-xs">{label}</span>
      </div>

      {active ? (
        <div className="flex items-center gap-0.5 text-[10px] font-medium text-primary">
          <Check className="size-3.5" />
        </div>
      ) : null}
    </Button>
  );
}
