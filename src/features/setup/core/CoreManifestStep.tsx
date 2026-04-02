import { SectionIntro } from "@/features/setup/SectionIntro";
import { InfoTile } from "@/features/setup/InfoTile";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Package } from "lucide-react";

export function CoreManifestStep() {
  return (
    <div className="space-y-4">
      <SectionIntro
        icon={Package}
        title="Manifest source"
        description="MewAMP resolves runtime packages automatically using a preferred remote source with a builtin fallback."
      />

      <div className="grid gap-4 md:grid-cols-2">
        <InfoTile
          title="Remote preferred"
          description="The app first attempts to resolve the latest manifest from your configured remote source."
        />
        <InfoTile
          title="Builtin fallback"
          description="If the remote manifest is unavailable, MewAMP falls back to the builtin manifest bundled with the app."
        />
      </div>

      <Alert className="rounded-2xl">
        <AlertTitle>No manual action needed</AlertTitle>
        <AlertDescription>
          Continue to the next step and MewAMP will resolve the manifest automatically before installation starts.
        </AlertDescription>
      </Alert>
    </div>
  );
}
