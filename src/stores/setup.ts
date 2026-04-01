import { atom } from "jotai";
import type { InstallConfig } from "@/lib/tauri-commands";

export const setupStepAtom = atom(0);
export const setupInstallingAtom = atom(false);
export const setupConfigAtom = atom<InstallConfig>({
  runtimeRoot: "",
  dataRoot: "",
  apacheHttpPort: 8080,
  apacheHttpsPort: 8443,
  mariadbPort: 3306,
  installPhpmyadmin: true,
  forceReinstall: false,
});
