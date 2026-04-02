import { Package, Server } from "lucide-react";
import { SummaryTile } from "@/features/settings/SummaryTile";
import type { SettingsSnapshot } from "@/features/settings/types";

export function ManifestSummaryCards({
  settings,
  loadingSettings,
}: {
  settings: SettingsSnapshot | null;
  loadingSettings: boolean;
}) {
  return (
    <div className="grid gap-3 md:grid-cols-2">
      <SummaryTile
        icon={Package}
        label="Manifest source"
        value={
          loadingSettings
            ? undefined
            : settings?.selected_manifest_source || "Not available"
        }
        loading={loadingSettings}
      />
      <SummaryTile
        icon={Server}
        label="Manifest version"
        value={
          loadingSettings
            ? undefined
            : settings?.selected_manifest_version || "Not available"
        }
        loading={loadingSettings}
      />
    </div>
  );
}
