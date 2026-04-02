import { PortField } from "@/features/setup/PortField";
import { SectionIntro } from "@/features/setup/SectionIntro";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import type { CoreSetupConfig } from "@/stores/setup";
import { Globe } from "lucide-react";

export function CorePortsStep({
  config,
  setConfig,
}: {
  config: CoreSetupConfig;
  setConfig: (c: CoreSetupConfig) => void;
}) {
  return (
    <div className="space-y-4">
      <SectionIntro
        icon={Globe}
        title="Configure local ports"
        description="A port is the local endpoint a service uses. If another app already uses the same port, the service cannot start."
      />

      <div className="grid gap-4 md:grid-cols-3">
        <PortField
          label="Apache HTTP Port"
          value={config.apacheHttpPort}
          example="http://localhost:8080"
          defaultValue="8080"
          onChange={(value) => setConfig({ ...config, apacheHttpPort: value })}
        />
        <PortField
          label="Apache HTTPS Port"
          value={config.apacheHttpsPort}
          example="https://localhost:8443"
          defaultValue="8443"
          onChange={(value) => setConfig({ ...config, apacheHttpsPort: value })}
        />
        <PortField
          label="MariaDB Port"
          value={config.mariadbPort}
          example="Client / backend database connections"
          defaultValue="3306"
          onChange={(value) => setConfig({ ...config, mariadbPort: value })}
        />
      </div>

      <Alert className="rounded-2xl">
        <AlertTitle>Tips for beginners</AlertTitle>
        <AlertDescription>
          Keep the defaults unless you already use another local stack like XAMPP, Docker, or IIS. If a conflict appears
          later, choose any unused port above 1024.
        </AlertDescription>
      </Alert>
    </div>
  );
}
