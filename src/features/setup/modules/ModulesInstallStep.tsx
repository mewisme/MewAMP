import type { RefObject } from "react";
import { SectionIntro } from "@/features/setup/SectionIntro";
import { InstallerLogPanel } from "@/features/setup/InstallerLogPanel";
import { Loader2, Wrench } from "lucide-react";

export function ModulesInstallStep({
  installing,
  installerLog,
  installerLogRef,
  onCopyLog,
}: {
  installing: boolean;
  installerLog: string;
  installerLogRef: RefObject<HTMLPreElement | null>;
  onCopyLog: () => void;
}) {
  return (
    <div className="space-y-4">
      <SectionIntro
        icon={installing ? Loader2 : Wrench}
        title={installing ? "Installing modules" : "Ready to install"}
        description={
          installing
            ? "Module installers run in order. Watch the shared installer log for progress and errors."
            : "The log includes output from all selected modules. Start when you are ready."
        }
        spinning={installing}
      />

      <InstallerLogPanel
        title="Installer log"
        description="Includes core and module installs."
        copyLabel="Copy log"
        logText={installerLog}
        logRef={installerLogRef}
        onCopy={onCopyLog}
      />
    </div>
  );
}
