import type { ElementType } from "react";
import { Card, CardContent } from "@/components/ui/card";

export function SummaryTile({
  icon: Icon,
  label,
  value,
}: {
  icon: ElementType;
  label: string;
  value: string;
}) {
  return (
    <Card className="rounded-2xl border-border/60 shadow-none">
      <CardContent className="flex items-start gap-3 p-5">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-muted">
          <Icon className="h-4 w-4 text-muted-foreground" />
        </div>

        <div className="min-w-0">
          <div className="text-sm text-muted-foreground">{label}</div>
          <div className="truncate font-medium">{value}</div>
        </div>
      </CardContent>
    </Card>
  );
}
