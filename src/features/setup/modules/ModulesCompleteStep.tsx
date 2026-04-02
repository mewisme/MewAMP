import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { SETUP_MODULE_REGISTRY } from "@/features/setup/modules/registry";
import type { SetupModuleId } from "@/features/setup/modules/registry";
import type { SqlLocalDbModuleConfig } from "@/stores/setup";
import { CheckCircle2 } from "lucide-react";

export function ModulesCompleteStep({
  installedIds,
  sqlConfig,
}: {
  installedIds: SetupModuleId[];
  sqlConfig: SqlLocalDbModuleConfig;
}) {
  return (
    <Card className="rounded-2xl border-emerald-500/20 bg-emerald-500/5 shadow-none">
      <CardContent className="flex flex-col items-center justify-center gap-4 p-8 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10">
          <CheckCircle2 className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
        </div>
        <div className="space-y-2">
          <h3 className="text-2xl font-semibold">Modules installed</h3>
          <p className="max-w-xl line-clamp-2 text-sm leading-snug text-muted-foreground">
            Selected components finished installation. You can return to the dashboard or install additional modules
            later when new ones are available.
          </p>
        </div>
        <div className="flex flex-wrap justify-center gap-2">
          {installedIds.map((id) => {
            const meta = SETUP_MODULE_REGISTRY[id];
            if (id === "sqllocaldb") {
              return (
                <Badge key={id} variant="outline" className="rounded-full px-3 py-1">
                  {meta.title} {sqlConfig.sqlLocaldbVersion} ({sqlConfig.sqlLocaldbInstanceName.trim() || "MewAMP"})
                </Badge>
              );
            }
            return (
              <Badge key={id} variant="outline" className="rounded-full px-3 py-1">
                {meta.title}
              </Badge>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
