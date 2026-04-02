import { platform } from "@tauri-apps/plugin-os";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getSetupModulesForPlatform } from "@/features/setup/modules/registry";
import { cn } from "@/lib/utils";
import { Package, Rocket, Puzzle } from "lucide-react";

export function SetupLanding({
  onPickCore,
  onPickModules,
}: {
  onPickCore: () => void;
  onPickModules: () => void;
}) {
  const availableModules = getSetupModulesForPlatform(platform());
  const modulesEnabled = availableModules.length > 0;

  return (
    <Card className="overflow-hidden rounded-xl border-border/60 bg-card/80 shadow-sm backdrop-blur-sm">
      <CardHeader className="gap-1 border-border/50">
        <div className="flex items-center gap-2">
          <div className="flex size-9 items-center justify-center rounded-lg bg-muted">
            <Rocket className="size-4 text-muted-foreground" />
          </div>
          <div>
            <CardTitle className="text-lg">Setup</CardTitle>
            <CardDescription className="text-xs">
              Core stack install or optional modules (SqlLocalDB, etc.).
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="grid gap-3 md:grid-cols-2">
        <button
          type="button"
          onClick={onPickCore}
          className={cn(
            "rounded-lg border border-border/60 bg-muted/20 p-4 text-left text-sm transition-colors hover:border-primary/30 hover:bg-primary/5",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          )}
        >
          <div className="mb-2 flex size-10 items-center justify-center rounded-lg border bg-background">
            <Package className="size-5 text-muted-foreground" />
          </div>
          <h3 className="font-semibold leading-tight">Core setup</h3>
          <p className="mt-1 line-clamp-2 text-xs leading-snug text-muted-foreground">
            Paths, ports, phpMyAdmin, manifest, and Apache / PHP / MariaDB install.
          </p>
        </button>

        <button
          type="button"
          disabled={!modulesEnabled}
          onClick={() => {
            if (modulesEnabled) onPickModules();
          }}
          className={cn(
            "rounded-lg border border-border/60 bg-muted/20 p-4 text-left text-sm transition-colors",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            modulesEnabled ? "hover:border-primary/30 hover:bg-primary/5" : "cursor-not-allowed opacity-60"
          )}
        >
          <div className="mb-2 flex items-start justify-between gap-2">
            <div className="flex size-10 items-center justify-center rounded-lg border bg-background">
              <Puzzle className="size-5 text-muted-foreground" />
            </div>
            {!modulesEnabled ? (
              <Badge variant="secondary" className="text-[10px]">
                N/A
              </Badge>
            ) : null}
          </div>
          <h3 className="font-semibold leading-tight">Modules setup</h3>
          <p className="mt-1 line-clamp-2 text-xs leading-snug text-muted-foreground">
            Optional components (e.g. SqlLocalDB), per-module config, then install.
          </p>
        </button>
      </CardContent>
    </Card>
  );
}
