import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { FeatureTile } from "@/features/setup/FeatureTile";
import { Package, Rocket, Settings2, Shield } from "lucide-react";

export function CoreWelcomeStep({
  onFastSetup,
  onManualSetup,
}: {
  onFastSetup: () => void;
  onManualSetup: () => void;
}) {
  return (
    <div className="grid gap-3 lg:grid-cols-[1.15fr_.85fr]">
      <Card className="rounded-xl border-border/60 bg-muted/20 shadow-none">
        <CardContent className="p-4">
          <div className="mb-4 flex items-center gap-2">
            <div className="flex size-9 items-center justify-center rounded-lg border bg-background">
              <Rocket className="size-4 text-muted-foreground" />
            </div>
            <div>
              <h3 className="text-base font-semibold leading-tight">Welcome to MewAMP</h3>
              <p className="line-clamp-2 text-xs leading-snug text-muted-foreground">
                Apache, PHP, MariaDB, and optional phpMyAdmin in guided steps.
              </p>
            </div>
          </div>

          <div className="grid gap-2 sm:grid-cols-3">
            <FeatureTile
              icon={Package}
              title="Manifest-based"
              description="Downloads selected runtime packages instead of bundling them."
            />
            <FeatureTile
              icon={Settings2}
              title="Configurable"
              description="Choose your own paths, ports, and optional components."
            />
            <FeatureTile
              icon={Shield}
              title="Beginner-friendly"
              description="Safe defaults and a manual flow when you need more control."
            />
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-xl border-border/60 shadow-none">
        <CardContent className="flex h-full flex-col justify-between p-4">
          <Alert className="rounded-lg py-3">
            <AlertTitle className="text-sm">Fast setup</AlertTitle>
            <AlertDescription className="line-clamp-2 text-xs leading-snug">
              Default paths and ports, phpMyAdmin included, jump to install.
            </AlertDescription>
          </Alert>

          <div className="mt-4 grid gap-2">
            <Button type="button" onClick={onFastSetup}>
              <Rocket className="mr-2 size-4" />
              Fast setup
            </Button>
            <Button type="button" variant="outline" onClick={onManualSetup}>
              Manual setup
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
