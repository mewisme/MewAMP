import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { exportDiagnostics, getDiagnostics } from "@/lib/tauri-commands";
import { toast } from "sonner";
import { DiagnosticsHeader } from "@/features/diagnostics/DiagnosticsHeader";
import { DiagnosticsToolbar } from "@/features/diagnostics/DiagnosticsToolbar";
import { DiagnosticsJsonView } from "@/features/diagnostics/DiagnosticsJsonView";

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
      <DiagnosticsHeader />

      <CardContent className="space-y-4">
        <DiagnosticsToolbar
          loading={loading}
          exporting={exporting}
          onLoad={() => void loadDiagnostics()}
          onExport={() => void handleExport()}
        />

        <DiagnosticsJsonView data={data} />
      </CardContent>
    </Card>
  );
}
