import type { ElementType } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function SummaryTile({
  icon: Icon,
  label,
  value,
  loading = false,
}: {
  icon: ElementType;
  label: string;
  value: string | undefined;
  loading?: boolean;
}) {
  return (
    <Card className="rounded-xl border-border/60 shadow-none">
      <CardContent className="flex items-start gap-2.5 p-4">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted">
          <Icon className="size-3.5 text-muted-foreground" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="text-xs text-muted-foreground">{label}</div>
          {loading ? (
            <Skeleton className="mt-1 h-4 w-full max-w-[220px]" />
          ) : (
            <div className="truncate text-sm font-medium capitalize">{value ?? "—"}</div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
