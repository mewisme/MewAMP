import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import type { PortStatus } from "@/features/settings/types";

export function PortStatusBadge({ status }: { status: PortStatus }) {
  if (status === "idle") {
    return (
      <Badge variant="outline" className="rounded-full px-3 py-1 text-xs text-muted-foreground">
        Not checked
      </Badge>
    );
  }

  if (status === "checking") {
    return (
      <Badge variant="outline" className="rounded-full px-3 py-1 text-xs">
        Checking...
      </Badge>
    );
  }

  if (status === "available") {
    return (
      <Badge
        variant="outline"
        className="rounded-full border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs text-emerald-600 dark:text-emerald-400"
      >
        <CheckCircle2 className="mr-1 h-3.5 w-3.5" />
        Available
      </Badge>
    );
  }

  return (
    <Badge
      variant="outline"
      className="rounded-full border-amber-500/20 bg-amber-500/10 px-3 py-1 text-xs text-amber-600 dark:text-amber-400"
    >
      <AlertCircle className="mr-1 h-3.5 w-3.5" />
      In use
    </Badge>
  );
}
