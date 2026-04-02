import type { ElementType } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function ActionOption({
  icon: Icon,
  label,
  active,
  onClick,
  destructive = false,
}: {
  icon: ElementType;
  label: string;
  active: boolean;
  onClick: () => void;
  destructive?: boolean;
}) {
  return (
    <Button
      type="button"
      variant="outline"
      onClick={onClick}
      className={cn(
        "h-11 justify-start rounded-xl px-4",
        active && !destructive && "border-primary/30 bg-primary/10 text-foreground",
        active && destructive && "border-destructive/30 bg-destructive/10 text-destructive",
        !active && destructive && "text-destructive hover:text-destructive"
      )}
    >
      <Icon className="mr-2 h-4 w-4 shrink-0" />
      <span>{label}</span>
    </Button>
  );
}
