import { useSetAtom } from "jotai";
import { useEffect } from "react";
import { refreshSqlLocaldbGlobalAtom } from "@/stores/sql-localdb";

export function SqlLocaldbGlobalSync(): null {
  const refresh = useSetAtom(refreshSqlLocaldbGlobalAtom);
  useEffect(() => {
    void refresh();
  }, [refresh]);
  return null;
}
