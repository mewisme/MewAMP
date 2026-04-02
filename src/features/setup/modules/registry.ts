import type { LucideIcon } from "lucide-react";
import { Database } from "lucide-react";

export const SETUP_MODULE_IDS = ["sqllocaldb"] as const;

export type SetupModuleId = (typeof SETUP_MODULE_IDS)[number];

export type SetupModulePlatform = "windows" | "macos" | "linux";

export type SetupModuleDefinition = {
  id: SetupModuleId;
  title: string;
  shortDescription: string;
  selectionDetail: string;
  icon: LucideIcon;
  platforms: SetupModulePlatform[];
};

export const SETUP_MODULE_REGISTRY: Record<SetupModuleId, SetupModuleDefinition> = {
  sqllocaldb: {
    id: "sqllocaldb",
    title: "SqlLocalDB",
    shortDescription: "Microsoft SQL Express LocalDB",
    selectionDetail: "Manifest MSIs, silent install, optional named instance after setup.",
    icon: Database,
    platforms: ["windows"],
  },
};

export function getSetupModulesForPlatform(platformName: string): SetupModuleDefinition[] {
  const p = platformName as SetupModulePlatform;
  return SETUP_MODULE_IDS.map((id) => SETUP_MODULE_REGISTRY[id]).filter((m) => m.platforms.includes(p));
}

export function orderedSelectedModules(selected: SetupModuleId[]): SetupModuleId[] {
  return SETUP_MODULE_IDS.filter((id) => selected.includes(id));
}
