import type { ElementType } from "react";
import { AppWindow, Wrench, Server, Database } from "lucide-react";
import type { LogKey } from "@/features/logs/types";

export type LogMetaItem = {
  key: LogKey;
  label: string;
  empty: string;
  icon: ElementType;
};

export function buildLogMeta(showSqlLocaldbLogTab: boolean): LogMetaItem[] {
  const base: LogMetaItem[] = [
    { key: "app", label: "App", empty: "No app logs yet.", icon: AppWindow },
    { key: "installer", label: "Installer", empty: "No installer logs yet.", icon: Wrench },
    { key: "apache", label: "Apache", empty: "No Apache logs yet.", icon: Server },
    { key: "mariadb", label: "MariaDB", empty: "No MariaDB logs yet.", icon: Database },
  ];
  if (showSqlLocaldbLogTab) {
    base.push({
      key: "sqllocaldb",
      label: "SqlLocalDB",
      empty: "No SqlLocalDB CLI logs yet. Use the Dashboard or Settings.",
      icon: Server,
    });
  }
  return base;
}
