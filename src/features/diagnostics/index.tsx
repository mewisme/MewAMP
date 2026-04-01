import { useState } from "react";
import { Activity, Download, FileJson, RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { exportDiagnostics, getDiagnostics } from "@/lib/tauri-commands";
import { toast } from "sonner";

export function DiagnosticsPanel() {
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);

  const loadDiagnostics = async () => {
    setLoading(true);
    try {
      const result = await getDiagnostics();
      setData(result);
      toast.success("Diagnostics loaded.");
    } catch (error) {
      console.error(error);
      toast.error("Failed to load diagnostics.");
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const path = await exportDiagnostics();
      toast.success(`Diagnostics bundle exported: ${path}`);
    } catch (error) {
      console.error(error);
      toast.error("Failed to export diagnostics bundle.");
    } finally {
      setExporting(false);
    }
  };

  return (
    <Card className="rounded-2xl border-border/60 bg-card/80 shadow-sm backdrop-blur-sm">
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

      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <Button onClick={loadDiagnostics} disabled={loading} className="h-11 rounded-xl">
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            {loading ? "Loading..." : "Load Diagnostics"}
          </Button>

          <Button
            variant="outline"
            onClick={handleExport}
            disabled={exporting}
            className="h-11 rounded-xl"
          >
            <Download className="mr-2 h-4 w-4" />
            {exporting ? "Exporting..." : "Export Bundle"}
          </Button>
        </div>

        <div className="rounded-2xl border border-border/60 bg-muted/20 p-1">
          {data ? (
            <pre className="max-h-[420px] overflow-auto whitespace-pre-wrap break-words rounded-xl bg-background/60 p-4 text-xs leading-6">
              {JSON.stringify(data, null, 2)}
            </pre>
          ) : (
            <div className="flex min-h-[220px] flex-col items-center justify-center rounded-xl bg-background/40 px-6 py-10 text-center">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-muted">
                <FileJson className="h-5 w-5 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium">No diagnostics loaded</p>
              <p className="mt-1 max-w-md text-sm text-muted-foreground">
                Load diagnostics to inspect the current runtime state, configuration, and troubleshooting details.
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}