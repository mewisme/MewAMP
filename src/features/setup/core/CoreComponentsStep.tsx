import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Switch } from "@/components/ui/switch";
import { ComponentTile } from "@/features/setup/ComponentTile";
import { OptionalComponentTile } from "@/features/setup/OptionalComponentTile";
import { SectionIntro } from "@/features/setup/SectionIntro";
import type { CoreSetupConfig } from "@/stores/setup";
import { Database, Globe, HardDrive, Package, Wrench } from "lucide-react";

export function CoreComponentsStep({
  config,
  setConfig,
  onOpenModules,
}: {
  config: CoreSetupConfig;
  setConfig: (c: CoreSetupConfig) => void;
  onOpenModules: () => void;
}) {
  return (
    <div className="space-y-4">
      <SectionIntro
        icon={Package}
        title="Select components"
        description="Required components are always installed. Optional tools can be enabled or skipped."
      />

      <div className="grid gap-4 md:grid-cols-2">
        <ComponentTile
          title="Apache"
          description="Web server runtime. Always installed from the selected manifest."
          required
          icon={Globe}
        />
        <ComponentTile
          title="PHP"
          description="PHP runtime for local development. Always installed from the selected manifest."
          required
          icon={Wrench}
        />
        <ComponentTile
          title="MariaDB"
          description="Local database runtime. Always installed from the selected manifest."
          required
          icon={Database}
        />
        <OptionalComponentTile
          title="phpMyAdmin"
          description="Browser-based database UI. Install it now or skip it for a lighter setup."
          checked={config.installPhpmyadmin}
          onCheckedChange={(checked) => setConfig({ ...config, installPhpmyadmin: checked })}
          icon={HardDrive}
        />
      </div>

      <Card className="rounded-2xl border-border/60 shadow-none">
        <CardContent className="flex items-start justify-between gap-4 p-5">
          <div className="space-y-1">
            <div className="font-medium">Force reinstall runtimes</div>
            <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
              Redownload and reinstall packages even if the installed versions already match the selected manifest.
            </p>
          </div>
          <Switch
            checked={config.forceReinstall}
            onCheckedChange={(checked) => setConfig({ ...config, forceReinstall: checked })}
          />
        </CardContent>
      </Card>

      <Alert className="rounded-2xl">
        <AlertTitle>SqlLocalDB</AlertTitle>
        <AlertDescription>
          Install Microsoft SQL Express LocalDB from{" "}
          <button type="button" className="font-medium text-primary underline" onClick={onOpenModules}>
            Modules setup
          </button>{" "}
          after core installation.
        </AlertDescription>
      </Alert>
    </div>
  );
}
