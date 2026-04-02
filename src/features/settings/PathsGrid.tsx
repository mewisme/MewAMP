import { toast } from "sonner";
import { PathTile } from "@/features/settings/PathTile";
import type { SettingsSnapshot } from "@/features/settings/types";
import { openFolder } from "@/lib/tauri-commands";

export function PathsGrid({ settings }: { settings: SettingsSnapshot }) {
  const openRuntimeRoot = async () => {
    const path = settings.runtime_root.trim();
    if (!path) return;
    try {
      await openFolder(path);
    } catch (error) {
      console.error(error);
      toast.error(`Failed to open folder: ${String(error)}`);
    }
  };

  return (
    <div className="grid gap-3 md:grid-cols-3">
      <PathTile label="Runtime Root" value={settings.runtime_root} onOpenFolder={() => void openRuntimeRoot()} />
      <PathTile label="Data Root" value={settings.data_root} />
      <PathTile label="Config Root" value={settings.config_root} />
    </div>
  );
}
