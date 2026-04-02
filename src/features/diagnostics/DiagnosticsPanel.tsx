import { useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { PanelShell } from "@/components/PanelShell";
import { exportDiagnostics, getDiagnostics } from "@/lib/tauri-commands";
import { writeText } from "@tauri-apps/plugin-clipboard-manager";
import { Activity } from "lucide-react";
import { toast } from "sonner";
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

  const copyJson = async () => {
    if (!data) return;
    try {
      await writeText(JSON.stringify(data, null, 2));
      toast.success("Diagnostics JSON copied.");
    } catch (error) {
      console.error(error);
      toast.error("Failed to copy diagnostics.");
    }
  };

  return (
    <PanelShell
      header={
        <PageHeader
          icon={Activity}
          title="Diagnostics"
          description="Inspect runtime state and export a support bundle."
        />
      }
    >
      <DiagnosticsToolbar
        loading={loading}
        exporting={exporting}
        canCopy={Boolean(data)}
        onLoad={() => void loadDiagnostics()}
        onExport={() => void handleExport()}
        onCopyJson={() => void copyJson()}
      />

      <DiagnosticsJsonView data={data} loading={loading} />
    </PanelShell>
  );
}
