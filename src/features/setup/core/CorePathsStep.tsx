import { PathField } from "@/features/setup/PathField";
import { SectionIntro } from "@/features/setup/SectionIntro";
import type { CoreSetupConfig } from "@/stores/setup";
import { FolderOpen } from "lucide-react";

export function CorePathsStep({
  config,
  setConfig,
  onBrowseRuntime,
  onBrowseData,
}: {
  config: CoreSetupConfig;
  setConfig: (c: CoreSetupConfig) => void;
  onBrowseRuntime: () => void;
  onBrowseData: () => void;
}) {
  return (
    <div className="grid gap-4">
      <SectionIntro
        icon={FolderOpen}
        title="Choose installation folders"
        description="Separate runtime files from your database data so the stack is easier to manage and back up."
      />

      <PathField
        label="Runtime Root"
        value={config.runtimeRoot}
        placeholder="C:\\Users\\YourName\\AppData\\Roaming\\MewAMP"
        hint="Runtime binaries and app-managed configs will be installed here."
        onChange={(value) => setConfig({ ...config, runtimeRoot: value })}
        onBrowse={onBrowseRuntime}
      />

      <PathField
        label="Data Root"
        value={config.dataRoot}
        placeholder="D:\\MewAMPData"
        hint="MariaDB database files will be stored here. Choose a stable location for backup."
        onChange={(value) => setConfig({ ...config, dataRoot: value })}
        onBrowse={onBrowseData}
      />
    </div>
  );
}
