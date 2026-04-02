import type { RefObject } from "react";
import { SectionIntro } from "@/features/setup/SectionIntro";
import { InstallerLogPanel } from "@/features/setup/InstallerLogPanel";
import { Loader2, Wrench } from "lucide-react";

export function CoreInstallStep({
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
        title={installing ? "Installing runtime stack" : "Ready to install"}
        description={
          installing
            ? "The installation pipeline is running. You can monitor progress in the live installer log below."
            : "Review the live installer log during setup. Start when you're ready."
        }
        spinning={installing}
      />

      <InstallerLogPanel
        title="Installer Log"
        description="Live output from the runtime installation pipeline."
        copyLabel="Copy Log"
        logText={installerLog}
        logRef={installerLogRef}
        onCopy={onCopyLog}
      />
    </div>
  );
}
