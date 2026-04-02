import { FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function LogsHeader() {
  return (
    <CardHeader className="pb-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-muted">
            <FileText className="h-5 w-5 text-muted-foreground" />
          </div>

          <div>
            <CardTitle className="text-lg leading-tight">Logs</CardTitle>
            <CardDescription className="mt-1">
              View live logs for the app, installer, Apache, MariaDB, and SqlLocalDB CLI output.
            </CardDescription>
          </div>
        </div>

        <Badge variant="outline" className="rounded-full px-2.5 py-1 text-xs">
          Live refresh 1s
        </Badge>
      </div>
    </CardHeader>
  );
}
