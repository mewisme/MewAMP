import { useCallback, useEffect, useState } from "react";
import { platform } from "@tauri-apps/plugin-os";
import { sqlLocaldbInitRuntime } from "@/lib/tauri-commands";

/**
 * Probes SqlLocalDB and ensures default **MewAMP** instance when the runtime is available.
 */
export function useSqlLocaldbRuntimeInit(): {
  sqlLocaldbRuntimeReady: boolean;
  recheckSqlLocaldbRuntime: () => Promise<boolean>;
} {
  const [ready, setReady] = useState(false);

  const recheckSqlLocaldbRuntime = useCallback(async (): Promise<boolean> => {
    if (platform() !== "windows") {
      setReady(false);
      return false;
    }
    try {
      const ok = await sqlLocaldbInitRuntime();
      setReady(ok);
      return ok;
    } catch (error) {
      console.error(error);
      setReady(false);
      return false;
    }
  }, []);

  useEffect(() => {
    void recheckSqlLocaldbRuntime();
  }, [recheckSqlLocaldbRuntime]);

  return { sqlLocaldbRuntimeReady: ready, recheckSqlLocaldbRuntime };
}
