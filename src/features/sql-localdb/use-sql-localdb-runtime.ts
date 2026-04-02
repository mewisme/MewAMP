import { useAtomValue } from "jotai";
import { useCallback } from "react";
import {
  refreshSqlLocaldbGlobalState,
  sqlLocaldbGlobalAtom,
  type SqlLocaldbGlobalSnapshot,
} from "@/stores/sql-localdb";

export function useSqlLocaldbRuntimeInit(): {
  sqlLocaldbRuntimeReady: boolean;
  sqlLocaldbGlobal: SqlLocaldbGlobalSnapshot;
  recheckSqlLocaldbRuntime: () => Promise<boolean>;
} {
  const sqlLocaldbGlobal = useAtomValue(sqlLocaldbGlobalAtom);
  const recheckSqlLocaldbRuntime = useCallback(() => refreshSqlLocaldbGlobalState(), []);
  return {
    sqlLocaldbRuntimeReady: sqlLocaldbGlobal.runtimeReady,
    sqlLocaldbGlobal,
    recheckSqlLocaldbRuntime,
  };
}
