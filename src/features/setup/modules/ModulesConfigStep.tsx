import { SectionIntro } from "@/features/setup/SectionIntro";
import { SqlLocalDbConfigCard } from "@/features/setup/modules/SqlLocalDbConfigCard";
import type { SetupModuleId } from "@/features/setup/modules/registry";
import type { SqlLocalDbModuleConfig } from "@/stores/setup";
import type { SqlLocalDbManifestEntry } from "@/lib/tauri-commands";
import { Settings2 } from "lucide-react";

export function ModulesConfigStep({
  selectedIds,
  modConfig,
  setModConfig,
  sqlLocaldbEntries,
  sqlLocaldbEntriesLoading,
  sqlLocaldbManifestError,
}: {
  selectedIds: SetupModuleId[];
  modConfig: SqlLocalDbModuleConfig;
  setModConfig: (c: SqlLocalDbModuleConfig) => void;
  sqlLocaldbEntries: SqlLocalDbManifestEntry[];
  sqlLocaldbEntriesLoading: boolean;
  sqlLocaldbManifestError: string | null;
}) {
  return (
    <div className="space-y-4">
      <SectionIntro
        icon={Settings2}
        title="Configure selected modules"
        description="Each module has its own card. Adjust options before running the combined install."
      />

      <div className="space-y-4">
        {selectedIds.includes("sqllocaldb") && (
          <SqlLocalDbConfigCard
            modConfig={modConfig}
            setModConfig={setModConfig}
            entries={sqlLocaldbEntries}
            entriesLoading={sqlLocaldbEntriesLoading}
            manifestError={sqlLocaldbManifestError}
          />
        )}
      </div>
    </div>
  );
}
