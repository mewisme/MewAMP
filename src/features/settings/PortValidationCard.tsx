import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SectionHeader } from "@/components/SectionHeader";
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
    <Card className="rounded-xl border-border/60 shadow-none">
      <CardContent className="space-y-3 p-4">
        <SectionHeader
          title="HTTP port"
          description="Check that the configured port is free before changing Apache."
        />

        <div className="space-y-1.5">
          <Label className="text-xs" htmlFor="http-port">
            Port
          </Label>
          <Input
            id="http-port"
            type="number"
            value={httpPort}
            onChange={(e) => onHttpPortChange(Number(e.target.value))}
          />
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <Button type="button" onClick={onValidate} disabled={portStatus === "checking"}>
            {portStatus === "checking" ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Checking...
              </>
            ) : (
              "Validate port"
            )}
          </Button>

          <PortStatusBadge status={portStatus} />
        </div>
      </CardContent>
    </Card>
  );
}
