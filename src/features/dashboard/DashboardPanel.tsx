import { useEffect, useRef, useState } from "react";
import { useAtom } from "jotai";
import { platform } from "@tauri-apps/plugin-os";
import { openUrl } from "@tauri-apps/plugin-opener";
import { toast } from "sonner";
import { servicesAtom, type ServiceRuntimeState } from "@/stores/services";
import {
  getHtdocsPath,
  getInstallState,
  getLogsDir,
  getServiceStatus,
  getSqlLocaldbInstanceStatus,
  openFolder,
  sqlLocaldbCli,
  startManagedService,
  stopService,
  type InstallState,
} from "@/lib/tauri-commands";
import { useSqlLocaldbInstanceOptions } from "@/features/sql-localdb/use-sql-localdb-instance-options";
import { useSqlLocaldbRuntimeInit } from "@/features/sql-localdb/use-sql-localdb-runtime";
import { mapSqlLocaldbStatus, isTransitionState } from "@/features/dashboard/dashboard-utils";
import { DashboardNotInstalled } from "@/features/dashboard/DashboardNotInstalled";
import { QuickActionsCard } from "@/features/dashboard/QuickActionsCard";
import { ServiceCard } from "@/features/dashboard/ServiceCard";
import { SimpleServiceCard } from "@/features/dashboard/SimpleServiceCard";
import { SqlLocaldbServiceCard } from "@/features/dashboard/SqlLocaldbServiceCard";
import { SqlLocaldbInfoDialog } from "@/features/dashboard/SqlLocaldbInfoDialog";
import { Globe, Settings2, FolderOpen, Activity } from "lucide-react";

export function DashboardPanel() {
  const [services, setServices] = useAtom(servicesAtom);
  const [isInstalled, setIsInstalled] = useState<boolean | null>(null);
  const [installState, setInstallState] = useState<InstallState | null>(null);
  const [sqlLocaldbInstance, setSqlLocaldbInstance] = useState("MewAMP");
  const [sqlLocaldbBusy, setSqlLocaldbBusy] = useState(false);
  const [sqlLocaldbInfoOpen, setSqlLocaldbInfoOpen] = useState(false);
  const [sqlLocaldbInfoText, setSqlLocaldbInfoText] = useState("");
  const [sqlLocaldbStatus, setSqlLocaldbStatus] = useState<ServiceRuntimeState>("unknown");
  const sqlLocaldbBusyRef = useRef(false);

  const osIsWindows = platform() === "windows";
  const { sqlLocaldbRuntimeReady } = useSqlLocaldbRuntimeInit();
  const managedSqlName = installState?.sql_localdb?.instance_name?.trim();
  const { instanceOptions, refreshInstances } = useSqlLocaldbInstanceOptions(
    managedSqlName,
    sqlLocaldbInstance,
    osIsWindows && sqlLocaldbRuntimeReady
  );

  useEffect(() => {
    const loadInstallState = async () => {
      try {
        const state = await getInstallState();
        setIsInstalled(state.install_completed);
        setInstallState(state);
      } catch (error) {
        console.error(error);
        setIsInstalled(false);
      }
    };
    void loadInstallState();
  }, []);

  useEffect(() => {
    sqlLocaldbBusyRef.current = sqlLocaldbBusy;
  }, [sqlLocaldbBusy]);

  useEffect(() => {
    const name = installState?.sql_localdb?.instance_name?.trim();
    if (name) setSqlLocaldbInstance(name);
  }, [installState?.sql_localdb?.instance_name]);

  useEffect(() => {
    if (isInstalled !== true || !osIsWindows || !sqlLocaldbRuntimeReady) return;

    const tick = async () => {
      const inst = sqlLocaldbInstance.trim();
      if (!inst) {
        setSqlLocaldbStatus("unknown");
        return;
      }
      try {
        const raw = await getSqlLocaldbInstanceStatus(inst);
        setSqlLocaldbStatus((prev) => {
          if (isTransitionState(prev)) return prev;
          if (sqlLocaldbBusyRef.current) return prev;
          return mapSqlLocaldbStatus(raw);
        });
      } catch (error) {
        console.error(error);
        setSqlLocaldbStatus((prev) => (isTransitionState(prev) ? prev : "unknown"));
      }
    };

    void tick();
    const id = setInterval(() => void tick(), 5000);
    return () => clearInterval(id);
  }, [isInstalled, osIsWindows, sqlLocaldbRuntimeReady, sqlLocaldbInstance]);

  useEffect(() => {
    if (isInstalled !== true) return;

    const tick = async () => {
      const apache = await getServiceStatus("apache");
      const mariadb = await getServiceStatus("mariadb");
      setServices((prev) => ({
        apache: isTransitionState(prev.apache) ? prev.apache : (apache.status as ServiceRuntimeState),
        mariadb: isTransitionState(prev.mariadb) ? prev.mariadb : (mariadb.status as ServiceRuntimeState),
      }));
    };

    void tick();
    const id = setInterval(tick, 5000);
    return () => clearInterval(id);
  }, [isInstalled, setServices]);

  if (isInstalled === false) {
    return <DashboardNotInstalled />;
  }

  if (isInstalled === null) {
    return <div className="text-sm text-muted-foreground">Loading install state...</div>;
  }

  const openLocalhost = async () => {
    const port = installState?.ports.apache_http ?? 8080;
    try {
      await openUrl(`http://127.0.0.1:${port}`);
    } catch (error) {
      console.error(error);
      toast.error("Failed to open localhost.");
    }
  };

  const openPhpMyAdmin = async () => {
    const port = installState?.ports.apache_http ?? 8080;
    try {
      await openUrl(`http://127.0.0.1:${port}/phpmyadmin/`);
    } catch (error) {
      console.error(error);
      toast.error("Failed to open phpMyAdmin.");
    }
  };

  const openHtdocs = async () => {
    try {
      const htdocsPath = await getHtdocsPath();
      await openFolder(htdocsPath);
    } catch (error) {
      console.error(error);
      toast.error(`Failed to open htdocs directory: ${String(error)}`);
    }
  };

  const openRuntime = async () => {
    const root = installState?.runtime_root;
    if (!root) return;
    try {
      await openFolder(root);
    } catch (error) {
      console.error(error);
      toast.error(`Failed to open runtime folder: ${String(error)}`);
    }
  };

  const openConfig = async () => {
    const root = installState?.config_root;
    if (!root) return;
    try {
      await openFolder(root);
    } catch (error) {
      console.error(error);
      toast.error(`Failed to open config folder: ${String(error)}`);
    }
  };

  const openLogFolder = async () => {
    try {
      const dir = await getLogsDir();
      await openFolder(dir);
    } catch (error) {
      console.error(error);
      toast.error(`Failed to open log folder: ${String(error)}`);
    }
  };

  const startDashboardService = async (name: "apache" | "mariadb") => {
    setServices((prev) => ({ ...prev, [name]: "starting" }));
    try {
      await startManagedService(name);
      const result = await getServiceStatus(name);
      setServices((prev) => ({ ...prev, [name]: result.status as ServiceRuntimeState }));
      toast.success(`${name} started.`);
    } catch (error) {
      console.error(error);
      setServices((prev) => ({ ...prev, [name]: "stopped" }));
      toast.error(`Failed to start ${name}: ${String(error)}`);
    }
  };

  const stopDashboardService = async (name: "apache" | "mariadb") => {
    setServices((prev) => ({ ...prev, [name]: "stopping" }));
    try {
      await stopService(name);
      const result = await getServiceStatus(name);
      setServices((prev) => ({ ...prev, [name]: result.status as ServiceRuntimeState }));
      toast.success(`${name} stopped.`);
    } catch (error) {
      console.error(error);
      setServices((prev) => ({ ...prev, [name]: "running" }));
      toast.error(`Failed to stop ${name}: ${String(error)}`);
    }
  };

  const restartService = async (name: "apache" | "mariadb") => {
    try {
      setServices((prev) => ({ ...prev, [name]: "stopping" }));
      await stopService(name);
      setServices((prev) => ({ ...prev, [name]: "starting" }));
      await startManagedService(name);
      const result = await getServiceStatus(name);
      setServices((prev) => ({ ...prev, [name]: result.status as ServiceRuntimeState }));
      toast.success(`${name} restarted.`);
    } catch (error) {
      console.error(error);
      const result = await getServiceStatus(name).catch(() => ({ status: "unknown" }));
      setServices((prev) => ({ ...prev, [name]: result.status as ServiceRuntimeState }));
      toast.error(`Failed to restart ${name}: ${String(error)}`);
    }
  };

  const runSqlLocaldb = async (command: "start" | "stop" | "info") => {
    const inst = sqlLocaldbInstance.trim();
    if (command === "start") setSqlLocaldbStatus("starting");
    if (command === "stop") setSqlLocaldbStatus("stopping");

    setSqlLocaldbBusy(true);
    try {
      const out = await sqlLocaldbCli(command, inst);
      await refreshInstances();
      if (command === "info") {
        setSqlLocaldbInfoText(out);
        setSqlLocaldbInfoOpen(true);
      } else {
        const raw = await getSqlLocaldbInstanceStatus(inst);
        setSqlLocaldbStatus(mapSqlLocaldbStatus(raw));
        toast.success(command === "start" ? "Started." : "Stopped.");
      }
    } catch (error) {
      console.error(error);
      toast.error("SqlLocalDB command failed.");
      try {
        const raw = await getSqlLocaldbInstanceStatus(inst);
        setSqlLocaldbStatus(mapSqlLocaldbStatus(raw));
      } catch {
        setSqlLocaldbStatus("unknown");
      }
    } finally {
      setSqlLocaldbBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      <QuickActionsCard
        onOpenLocalhost={() => void openLocalhost()}
        onOpenPhpMyAdmin={() => void openPhpMyAdmin()}
        onOpenHtdocs={() => void openHtdocs()}
        onOpenRuntime={() => void openRuntime()}
        onOpenConfig={() => void openConfig()}
        onOpenLogFolder={() => void openLogFolder()}
      />

      <div className="grid gap-4 md:grid-cols-2">
        <ServiceCard
          name="Apache"
          type="apache"
          status={services.apache}
          description="Handles HTTP requests for your local web apps."
          onStart={() => startDashboardService("apache")}
          onStop={() => stopDashboardService("apache")}
          onRestart={() => restartService("apache")}
        />

        <ServiceCard
          name="MariaDB"
          type="database"
          status={services.mariadb}
          description="Local database server for apps and phpMyAdmin."
          onStart={() => startDashboardService("mariadb")}
          onStop={() => stopDashboardService("mariadb")}
          onRestart={() => restartService("mariadb")}
        />

        <SimpleServiceCard
          name="PHP"
          type="php"
          description="Used by Apache via FastCGI."
          actions={[
            { label: "Open htdocs", onClick: openHtdocs, icon: FolderOpen },
            { label: "Open Runtime", onClick: openRuntime, icon: Activity },
          ]}
        />

        <SimpleServiceCard
          name="phpMyAdmin"
          type="phpmyadmin"
          description="Browser-based database management UI."
          actions={[
            { label: "Open Browser", onClick: openPhpMyAdmin, icon: Globe },
            { label: "Open Config", onClick: openConfig, icon: Settings2 },
          ]}
        />

        {osIsWindows && sqlLocaldbRuntimeReady && (
          <SqlLocaldbServiceCard
            instanceOptions={instanceOptions}
            instance={sqlLocaldbInstance}
            onInstanceChange={setSqlLocaldbInstance}
            status={sqlLocaldbStatus}
            busy={sqlLocaldbBusy}
            onCommand={(cmd) => void runSqlLocaldb(cmd)}
          />
        )}
      </div>

      <SqlLocaldbInfoDialog
        open={sqlLocaldbInfoOpen}
        onOpenChange={setSqlLocaldbInfoOpen}
        instanceLabel={sqlLocaldbInstance.trim()}
        text={sqlLocaldbInfoText}
      />
    </div>
  );
}
