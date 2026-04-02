import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getStatusBadgeClass } from "@/features/dashboard/dashboard-utils";
import { cn } from "@/lib/utils";
import { Puzzle } from "lucide-react";

export function ModulesWelcomeStep() {
  return (
    <Card className="rounded-2xl border-border/60 bg-muted/20 shadow-none">
      <CardContent className="space-y-4 p-6">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-background border">
              <Puzzle className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="min-w-0">
              <h3 className="text-lg font-semibold">Optional modules</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Add components beyond the core Apache, PHP, and MariaDB stack. Choose what you need on the next step,
                then configure each module in its own card.
              </p>
            </div>
          </div>

          <Badge
            variant="outline"
            className={cn(
              "shrink-0 rounded-full px-2.5 py-1 text-xs",
              getStatusBadgeClass("available")
            )}
          >
            Extensible
          </Badge>
        </div>

        <ul className="list-inside list-disc space-y-2 text-sm text-muted-foreground">
          <li>Modules are installed separately from core setup.</li>
          <li>Some modules require administrator elevation or a specific operating system.</li>
          <li>Install core first so cache and paths align with your deployment.</li>
        </ul>
      </CardContent>
    </Card>
  );
}
