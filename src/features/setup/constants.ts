import type { CoreSetupConfig } from "@/stores/setup";
import type { InstallConfig } from "@/lib/tauri-commands";

export const coreSteps = ["Welcome", "Paths", "Ports", "Components", "Manifest", "Install", "Complete"];

export const modulesSetupSteps = ["Welcome", "Select", "Config", "Install", "Complete"];

export const SQL_LOCALDB_INSTANCE_PATTERN = /^[a-zA-Z0-9_]+$/;

export const DEFAULT_CORE_SETUP: CoreSetupConfig = {
  runtimeRoot: "",
  dataRoot: "",
  apacheHttpPort: 8080,
  apacheHttpsPort: 8443,
  mariadbPort: 3306,
  installPhpmyadmin: true,
  forceReinstall: false,
};

export function toInstallPayload(config: CoreSetupConfig): InstallConfig {
  return {
    ...config,
    installSqlLocaldb: false,
    sqlLocaldbVersion: "2025",
    sqlLocaldbInstanceName: "MewAMP",
  };
}
