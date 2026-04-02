import { atom } from "jotai";
import type { InstallConfig } from "@/lib/tauri-commands";
import type { SetupModuleId } from "@/features/setup/modules/registry";

export type SetupFlow = "landing" | "core" | "modules";

export const setupFlowAtom = atom<SetupFlow>("landing");
export const setupStepAtom = atom(0);
export const modulesSetupStepAtom = atom(0);
export const setupInstallingAtom = atom(false);

export const selectedSetupModuleIdsAtom = atom<SetupModuleId[]>([]);

export type SqlLocalDbModuleConfig = {
  sqlLocaldbVersion: string;
  sqlLocaldbInstanceName: string;
  forceReinstall: boolean;
};

export const sqlLocaldbModuleConfigAtom = atom<SqlLocalDbModuleConfig>({
  sqlLocaldbVersion: "2025",
  sqlLocaldbInstanceName: "MewAMP",
  forceReinstall: false,
});

export type CoreSetupConfig = Omit<
  InstallConfig,
  "installSqlLocaldb" | "sqlLocaldbVersion" | "sqlLocaldbInstanceName"
>;

export const setupConfigAtom = atom<CoreSetupConfig>({
  runtimeRoot: "",
  dataRoot: "",
  apacheHttpPort: 8080,
  apacheHttpsPort: 8443,
  mariadbPort: 3306,
  installPhpmyadmin: true,
  forceReinstall: false,
});
