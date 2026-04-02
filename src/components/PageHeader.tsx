import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function PageHeader({
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
    <CardHeader className={cn("border-0 pb-0 pt-4 shadow-none", className)}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-2.5">
          {Icon ? (
            <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted">
              <Icon className="size-4 text-muted-foreground" />
            </div>
          ) : null}
          <div className="min-w-0">
            <CardTitle className="text-base leading-tight">{title}</CardTitle>
            {description ? (
              <CardDescription className="mt-0.5 text-xs">{description}</CardDescription>
            ) : null}
          </div>
        </div>
        {trailing ? <div className="shrink-0">{trailing}</div> : null}
      </div>
    </CardHeader>
  );
}
