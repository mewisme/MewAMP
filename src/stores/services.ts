import { atom } from "jotai";

export type ServiceRuntimeState = "running" | "stopped" | "unknown" | "starting" | "stopping";

export const servicesAtom = atom<{ apache: ServiceRuntimeState; mariadb: ServiceRuntimeState }>({
  apache: "unknown",
  mariadb: "unknown",
});
