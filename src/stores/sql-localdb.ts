import { atom, getDefaultStore } from "jotai";
import { platform } from "@tauri-apps/plugin-os";
import { getInstallState, sqlLocaldbInitRuntime } from "@/lib/tauri-commands";

export type SqlLocaldbGlobalSnapshot = {
  runtimeReady: boolean;
  managedByApp: boolean;
  version: string | null;
  managedInstanceName: string | null;
  loading: boolean;
};

function emptySnapshot(): SqlLocaldbGlobalSnapshot {
  return {
    runtimeReady: false,
    managedByApp: false,
    version: null,
    managedInstanceName: null,
    loading: false,
  };
}

export const sqlLocaldbGlobalAtom = atom<SqlLocaldbGlobalSnapshot>(emptySnapshot());

export const refreshSqlLocaldbGlobalAtom = atom(null, async (_get, set) => {
  if (platform() !== "windows") {
    set(sqlLocaldbGlobalAtom, emptySnapshot());
    return;
  }
  set(sqlLocaldbGlobalAtom, (s) => ({ ...s, loading: true }));
  let runtimeReady = false;
  try {
    runtimeReady = await sqlLocaldbInitRuntime();
  } catch (error) {
    console.error(error);
  }
  let installState: Awaited<ReturnType<typeof getInstallState>> | null = null;
  try {
    installState = await getInstallState();
  } catch (error) {
    console.error(error);
  }
  const rec = installState?.sql_localdb ?? null;
  set(sqlLocaldbGlobalAtom, {
    runtimeReady,
    managedByApp: Boolean(rec?.installed_by_app),
    version: rec?.version ?? null,
    managedInstanceName: rec?.instance_name?.trim() || null,
    loading: false,
  });
});

export async function refreshSqlLocaldbGlobalState(): Promise<boolean> {
  await getDefaultStore().set(refreshSqlLocaldbGlobalAtom);
  return getDefaultStore().get(sqlLocaldbGlobalAtom).runtimeReady;
}
