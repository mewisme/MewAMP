import { Download, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export function DiagnosticsToolbar({
  loading,
  exporting,
  onLoad,
  onExport,
}: {
  loading: boolean;
  exporting: boolean;
  onLoad: () => void;
  onExport: () => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      <Button onClick={onLoad} disabled={loading} className="h-11 rounded-xl">
        <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
        {loading ? "Loading..." : "Load Diagnostics"}
      </Button>

      <Button variant="outline" onClick={onExport} disabled={exporting} className="h-11 rounded-xl">
        <Download className="mr-2 h-4 w-4" />
        {exporting ? "Exporting..." : "Export Bundle"}
      </Button>
    </div>
  );
}
