import type { ElementType } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getServiceMeta, getStatusBadgeClass } from "@/features/dashboard/dashboard-utils";
import { cn } from "@/lib/utils";

export function SimpleServiceCard({
  name,
  type,
  description,
  actions,
}: {
  name: string;
  type: "php" | "phpmyadmin";
  description: string;
  actions: Array<{ label: string; onClick: () => void; icon?: ElementType }>;
}) {
  const meta = getServiceMeta(type);
  const Icon = meta.icon;

  return (
    <Card className="h-full rounded-2xl border-border/60 bg-card/80 shadow-sm backdrop-blur-sm transition-all hover:border-border">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-muted">
              <Icon className="h-5 w-5 shrink-0 text-muted-foreground" />
            </div>

            <div className="min-h-[60px] min-w-0">
              <CardTitle className="text-lg leading-tight">{name}</CardTitle>
              <CardDescription className="mt-1 line-clamp-2 leading-snug">{description}</CardDescription>
            </div>
          </div>

          <Badge
            variant="outline"
            className={cn(
              "shrink-0 rounded-full px-2.5 py-1 text-xs capitalize",
              getStatusBadgeClass("available")
            )}
          >
            Available
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="flex h-full flex-col gap-4">
        <div className="rounded-xl border border-border/50 bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
          Utility tools and shortcuts.
        </div>

        <div className="mt-auto grid gap-2 sm:grid-cols-2">
          {actions.map((action) => {
            const ActionIcon = action.icon;
            return (
              <Button
                key={action.label}
                variant="outline"
                onClick={action.onClick}
                className="h-11 justify-start rounded-xl px-4"
              >
                {ActionIcon ? <ActionIcon className="mr-2 h-4 w-4 shrink-0" /> : null}
                <span className="truncate">{action.label}</span>
              </Button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
