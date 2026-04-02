import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PortStatusBadge } from "@/features/settings/PortStatusBadge";
import type { PortStatus } from "@/features/settings/types";
import { Loader2 } from "lucide-react";

export function PortValidationCard({
  httpPort,
  onHttpPortChange,
  portStatus,
  onValidate,
}: {
  httpPort: number;
  onHttpPortChange: (n: number) => void;
  portStatus: PortStatus;
  onValidate: () => void;
}) {
  return (
    <Card className="rounded-2xl border-border/60 shadow-none">
      <CardContent className="space-y-4 p-5">
        <div className="space-y-1">
          <div className="font-medium">HTTP Port Validation</div>
          <p className="text-sm text-muted-foreground">
            Check whether the selected local HTTP port is free before applying it.
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="http-port">HTTP Port</Label>
          <Input
            id="http-port"
            type="number"
            value={httpPort}
            onChange={(e) => onHttpPortChange(Number(e.target.value))}
          />
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Button onClick={onValidate} disabled={portStatus === "checking"} className="h-11 rounded-xl">
            {portStatus === "checking" ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Checking...
              </>
            ) : (
              "Validate Port"
            )}
          </Button>

          <PortStatusBadge status={portStatus} />
        </div>
      </CardContent>
    </Card>
  );
}
