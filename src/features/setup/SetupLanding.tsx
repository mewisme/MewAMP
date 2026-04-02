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
    <Card className="overflow-hidden rounded-3xl border-border/60 bg-card/80 shadow-sm backdrop-blur-sm">
      <CardHeader className="gap-2 border-b border-border/50 pb-5">
        <div className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-muted">
            <Rocket className="h-5 w-5 text-muted-foreground" />
          </div>
          <div>
            <CardTitle className="text-2xl">Setup</CardTitle>
            <CardDescription className="mt-1">
              Core setup installs Apache, PHP, and MariaDB. Modules setup adds optional components you select and
              configure.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="grid gap-4 p-6 md:grid-cols-2">
        <button
          type="button"
          onClick={onPickCore}
          className={cn(
            "rounded-2xl border border-border/60 bg-muted/20 p-6 text-left transition-all hover:border-primary/30 hover:bg-primary/5",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          )}
        >
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-background border">
            <Package className="h-6 w-6 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold">Core setup</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Paths, ports, phpMyAdmin, manifest resolution, and installation of the main runtime stack.
          </p>
        </button>

        <button
          type="button"
          disabled={!modulesEnabled}
          onClick={() => {
            if (modulesEnabled) onPickModules();
          }}
          className={cn(
            "rounded-2xl border border-border/60 bg-muted/20 p-6 text-left transition-all",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            modulesEnabled ? "hover:border-primary/30 hover:bg-primary/5" : "cursor-not-allowed opacity-60"
          )}
        >
          <div className="mb-4 flex items-start justify-between gap-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-background border">
              <Puzzle className="h-6 w-6 text-muted-foreground" />
            </div>
            {!modulesEnabled && <Badge variant="secondary">None for this OS</Badge>}
          </div>
          <h3 className="text-lg font-semibold">Modules setup</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Pick optional components (for example SqlLocalDB), configure each in its own card, then install.
          </p>
        </button>
      </CardContent>
    </Card>
  );
}
