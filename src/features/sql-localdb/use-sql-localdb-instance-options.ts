import { useCallback, useEffect, useMemo, useState } from "react";
import { platform } from "@tauri-apps/plugin-os";
import { listSqlLocaldbInstances } from "@/lib/tauri-commands";

export function useSqlLocaldbInstanceOptions(
  managedInstanceName: string | undefined,
  selectedValue: string,
  fetchEnabled = true,
): { instanceOptions: string[]; refreshInstances: () => Promise<void> } {
  const [instances, setInstances] = useState<string[]>([]);

  const refreshInstances = useCallback(async () => {
    if (!fetchEnabled || platform() !== "windows") {
      setInstances([]);
      return;
    }
    try {
      const list = await listSqlLocaldbInstances();
      setInstances(list);
    } catch (error) {
      console.error(error);
    }
  }, [fetchEnabled]);

  useEffect(() => {
    void refreshInstances();
  }, [refreshInstances]);

  const instanceOptions = useMemo(() => {
    const set = new Set<string>(instances);
    const m = managedInstanceName?.trim();
    if (m) set.add(m);
    const s = selectedValue.trim();
    if (s) set.add(s);
    if (set.size === 0) set.add("MewAMP");
    return [...set].sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }));
  }, [instances, managedInstanceName, selectedValue]);

  return { instanceOptions, refreshInstances };
}
