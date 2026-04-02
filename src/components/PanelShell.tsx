import type { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function PanelShell({
  header,
  children,
  className,
  contentClassName,
}: {
  header: ReactNode;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
}) {
  return (
    <Card
      className={cn(
        "gap-0 py-0 rounded-xl border-border/60 bg-card/80 shadow-sm backdrop-blur-sm",
        className
      )}
    >
      {header}
      <CardContent className={cn("space-y-3 pb-4 pt-4", contentClassName)}>{children}</CardContent>
    </Card>
  );
}
