import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function SectionHeader({
  icon: Icon,
  title,
  description,
  trailing,
  className,
}: {
  icon?: LucideIcon;
  title: string;
  description?: string;
  trailing?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex items-start justify-between gap-2", className)}>
      <div className="flex min-w-0 items-start gap-2">
        {Icon ? (
          <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-muted">
            <Icon className="size-3.5 text-muted-foreground" />
          </div>
        ) : null}
        <div className="min-w-0">
          <div className="text-sm font-medium leading-tight">{title}</div>
          {description ? (
            <p className="mt-0.5 line-clamp-2 text-xs leading-snug text-muted-foreground">{description}</p>
          ) : null}
        </div>
      </div>
      {trailing ? <div className="shrink-0">{trailing}</div> : null}
    </div>
  );
}
