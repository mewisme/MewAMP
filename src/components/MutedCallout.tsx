import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function MutedCallout({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "rounded-lg border border-border/50 bg-muted/30 px-3 py-2 text-xs leading-relaxed text-muted-foreground",
        className
      )}
    >
      {children}
    </div>
  );
}
