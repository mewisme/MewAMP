import { Activity } from "lucide-react";
import { CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function DiagnosticsHeader() {
  return (
    <CardHeader className="pb-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-muted">
            <Activity className="h-5 w-5 text-muted-foreground" />
          </div>

          <div>
            <CardTitle className="text-lg leading-tight">Diagnostics</CardTitle>
            <CardDescription className="mt-1">
              Inspect runtime information and export a support bundle for troubleshooting.
            </CardDescription>
          </div>
        </div>
      </div>
    </CardHeader>
  );
}
