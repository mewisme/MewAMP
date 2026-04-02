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
    <div className="grid gap-4 md:grid-cols-2">
      <SummaryTile
        icon={Package}
        label="Manifest Source"
        value={loadingSettings ? "Loading..." : settings?.selected_manifest_source || "Not available"}
      />
      <SummaryTile
        icon={Server}
        label="Manifest Version"
        value={loadingSettings ? "Loading..." : settings?.selected_manifest_version || "Not available"}
      />
    </div>
  );
}
