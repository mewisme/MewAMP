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
    <div className="grid gap-4 lg:grid-cols-[1.15fr_.85fr]">
      <Card className="rounded-2xl border-border/60 bg-muted/20 shadow-none">
        <CardContent className="p-6">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-background border">
              <Rocket className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">Welcome to MewAMP</h3>
              <p className="text-sm text-muted-foreground">
                Set up Apache, PHP, MariaDB, and optional phpMyAdmin in a few guided steps.
              </p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
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

      <Card className="rounded-2xl border-border/60 shadow-none">
        <CardContent className="flex h-full flex-col justify-between p-6">
          <div className="space-y-3">
            <Alert className="rounded-2xl">
              <AlertTitle>Fast Setup</AlertTitle>
              <AlertDescription>
                Use default paths and ports, include phpMyAdmin, and jump directly to the install step.
              </AlertDescription>
            </Alert>
          </div>

          <div className="mt-6 grid gap-3">
            <Button size="lg" className="h-12 rounded-xl" onClick={onFastSetup}>
              <Rocket className="mr-2 h-4 w-4" />
              Fast Setup
            </Button>
            <Button size="lg" variant="outline" className="h-12 rounded-xl" onClick={onManualSetup}>
              Manual Setup
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
