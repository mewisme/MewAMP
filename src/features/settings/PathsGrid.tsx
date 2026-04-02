import { PathTile } from "@/features/settings/PathTile";
import type { SettingsSnapshot } from "@/features/settings/types";

export function PathsGrid({ settings }: { settings: SettingsSnapshot }) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <PathTile label="Runtime Root" value={settings.runtime_root} />
      <PathTile label="Data Root" value={settings.data_root} />
      <PathTile label="Config Root" value={settings.config_root} />
    </div>
  );
}
