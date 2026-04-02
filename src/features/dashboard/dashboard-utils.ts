import { Globe, Server, Database, Activity } from "lucide-react";
import type { ServiceRuntimeState } from "@/stores/services";

export function mapSqlLocaldbStatus(raw: string): ServiceRuntimeState {
  switch (raw) {
    case "running":
    case "stopped":
    case "starting":
    case "stopping":
    case "unknown":
      return raw;
    default:
      return "unknown";
  }
}

export function getServiceMeta(type: "apache" | "database" | "php" | "phpmyadmin" | "sqllocaldb") {
  switch (type) {
    case "apache":
      return { icon: Server, iconWrapClass: "bg-muted" };
    case "database":
      return { icon: Database, iconWrapClass: "bg-muted" };
    case "php":
      return { icon: Activity, iconWrapClass: "bg-muted" };
    case "phpmyadmin":
      return { icon: Globe, iconWrapClass: "bg-muted" };
    case "sqllocaldb":
      return { icon: Database, iconWrapClass: "bg-muted" };
  }
}

export function isTransitionState(status: ServiceRuntimeState): boolean {
  return status === "starting" || status === "stopping";
}

export function getStatusBadgeClass(
  status: "running" | "stopped" | "unknown" | "available" | "starting" | "stopping"
) {
  switch (status) {
    case "running":
      return "border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400";
    case "starting":
      return "border-blue-500/20 bg-blue-500/10 text-blue-600 dark:text-blue-400";
    case "stopping":
      return "border-orange-500/20 bg-orange-500/10 text-orange-600 dark:text-orange-400";
    case "stopped":
      return "border-border bg-muted text-muted-foreground";
    case "unknown":
      return "border-amber-500/20 bg-amber-500/10 text-amber-600 dark:text-amber-400";
    case "available":
      return "border-sky-500/20 bg-sky-500/10 text-sky-600 dark:text-sky-400";
  }
}
