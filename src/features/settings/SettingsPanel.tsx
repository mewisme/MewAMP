import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { platform } from "@tauri-apps/plugin-os";
import { useTheme } from "next-themes";
import { toast } from "sonner";
import { PageHeader } from "@/components/PageHeader";
import { PanelShell } from "@/components/PanelShell";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Settings2 } from "lucide-react";
import { checkPorts, sqlLocaldbCli, uninstallAppManagedSqlLocaldb } from "@/lib/tauri-commands";
import { useSqlLocaldbInstanceOptions } from "@/features/sql-localdb/use-sql-localdb-instance-options";
import { useSqlLocaldbRuntimeInit } from "@/features/sql-localdb/use-sql-localdb-runtime";
import type { PortStatus, SettingsSnapshot, SqlLocalDbAction } from "@/features/settings/types";
import { ManifestSummaryCards } from "@/features/settings/ManifestSummaryCards";
import { SqlLocaldbSettingsCard } from "@/features/settings/SqlLocaldbSettingsCard";
import { AppearanceCard } from "@/features/settings/AppearanceCard";
import { PortValidationCard } from "@/features/settings/PortValidationCard";
import { PathsGrid } from "@/features/settings/PathsGrid";

export function SettingsPanel() {
  const [settings, setSettings] = useState<SettingsSnapshot | null>(null);
  const [httpPort, setHttpPort] = useState(8080);
  const [loadingSettings, setLoadingSettings] = useState(true);
  const [portStatus, setPortStatus] = useState<PortStatus>("idle");
  const [mounted, setMounted] = useState(false);
  const [settingsTab, setSettingsTab] = useState("overview");

  const [sqlLocaldbBusy, setSqlLocaldbBusy] = useState(false);
  const [sqlLocaldbCreateInstance, setSqlLocaldbCreateInstance] = useState("MewAMP");
  const [sqlLocaldbDeleteInstance, setSqlLocaldbDeleteInstance] = useState("");
  const [sqlLocaldbAction, setSqlLocaldbAction] = useState<SqlLocalDbAction>("create");

  const osIsWindows = platform() === "windows";
  const { sqlLocaldbRuntimeReady, recheckSqlLocaldbRuntime, sqlLocaldbGlobal } = useSqlLocaldbRuntimeInit();
  const sqlLocaldbManaged = sqlLocaldbGlobal.managedByApp;
  const sqlLocaldbVersion = sqlLocaldbGlobal.version;
  const sqlLocaldbInstanceName = sqlLocaldbGlobal.managedInstanceName;
  const showSqlLocaldbSettingsCard = osIsWindows && (sqlLocaldbManaged || sqlLocaldbRuntimeReady);

  const { instanceOptions, refreshInstances } = useSqlLocaldbInstanceOptions(
    sqlLocaldbInstanceName ?? undefined,
    sqlLocaldbDeleteInstance,
    sqlLocaldbRuntimeReady
  );

  const { theme, setTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const loadSettings = async () => {
      setLoadingSettings(true);
      try {
        const result = await invoke<SettingsSnapshot>("get_app_settings");
        setSettings(result);
      } catch (error) {
        console.error(error);
        toast.error("Failed to load settings.");
      } finally {
        setLoadingSettings(false);
      }
    };
    loadSettings();
  }, []);

  useEffect(() => {
    const n = sqlLocaldbInstanceName?.trim();
    if (n) setSqlLocaldbDeleteInstance(n);
  }, [sqlLocaldbInstanceName]);

  useEffect(() => {
    if (!sqlLocaldbDeleteInstance && instanceOptions.length > 0) {
      setSqlLocaldbDeleteInstance(instanceOptions[0]);
    }
  }, [instanceOptions, sqlLocaldbDeleteInstance]);

  useEffect(() => {
    if (sqlLocaldbAction === "delete" && !sqlLocaldbRuntimeReady) {
      setSqlLocaldbAction("create");
    }
    if (sqlLocaldbAction === "uninstall" && !sqlLocaldbManaged) {
      setSqlLocaldbAction(sqlLocaldbRuntimeReady ? "create" : "uninstall");
    }
  }, [sqlLocaldbAction, sqlLocaldbManaged, sqlLocaldbRuntimeReady]);

  useEffect(() => {
    if (!showSqlLocaldbSettingsCard && settingsTab === "sqllocaldb") {
      setSettingsTab("overview");
    }
  }, [showSqlLocaldbSettingsCard, settingsTab]);

  useEffect(() => {
    if (!sqlLocaldbRuntimeReady && sqlLocaldbManaged) {
      setSqlLocaldbAction("uninstall");
    }
  }, [sqlLocaldbRuntimeReady, sqlLocaldbManaged]);

  const onCreateSqlLocaldbInstance = async () => {
    const inst = sqlLocaldbCreateInstance.trim();
    if (!inst) {
      toast.error("Enter an instance name.");
      return;
    }

    setSqlLocaldbBusy(true);
    try {
      await sqlLocaldbCli("create", inst);
      await refreshInstances();
      setSqlLocaldbDeleteInstance(inst);
      void recheckSqlLocaldbRuntime();
      toast.success("SqlLocalDB created instance.");
    } catch (error) {
      console.error(error);
      toast.error("SqlLocalDB command failed.");
    } finally {
      setSqlLocaldbBusy(false);
    }
  };

  const onDeleteSqlLocaldbInstance = async () => {
    const inst = sqlLocaldbDeleteInstance.trim();
    if (!inst) {
      toast.error("Select an instance to delete.");
      return;
    }

    setSqlLocaldbBusy(true);
    try {
      await sqlLocaldbCli("delete", inst);
      await refreshInstances();
      setSqlLocaldbDeleteInstance("");
      void recheckSqlLocaldbRuntime();
      toast.success("SqlLocalDB deleted instance.");
    } catch (error) {
      console.error(error);
      toast.error("SqlLocalDB command failed.");
    } finally {
      setSqlLocaldbBusy(false);
    }
  };

  const validatePort = async () => {
    setPortStatus("checking");
    try {
      const result = await checkPorts([httpPort]);
      const available = result[0]?.available;

      if (available) {
        setPortStatus("available");
        toast.success("Port is available.");
      } else {
        setPortStatus("in_use");
        toast.error("Port is already in use.");
      }
    } catch (error) {
      console.error(error);
      setPortStatus("idle");
      toast.error("Failed to validate port.");
    }
  };

  const onUninstallSqlLocaldb = async () => {
    setSqlLocaldbBusy(true);
    try {
      await uninstallAppManagedSqlLocaldb();
      toast.success("SqlLocalDB uninstalled.");
    } catch (error) {
      console.error(error);
      toast.error("Could not uninstall SqlLocalDB.");
    } finally {
      setSqlLocaldbBusy(false);
    }

    void recheckSqlLocaldbRuntime();
  };

  return (
    <PanelShell
      header={
        <PageHeader
          icon={Settings2}
          title="Settings"
          description="Manifest, paths, appearance, ports, and optional SqlLocalDB."
        />
      }
    >
      <Tabs value={settingsTab} onValueChange={setSettingsTab} className="gap-3">
          <TabsList className="h-auto min-h-8 w-full flex-wrap justify-start gap-0.5 bg-muted/50 p-1">
            <TabsTrigger value="overview" className="px-2 py-1 text-xs">
              Overview
            </TabsTrigger>
            <TabsTrigger value="appearance" className="px-2 py-1 text-xs">
              Appearance
            </TabsTrigger>
            <TabsTrigger value="network" className="px-2 py-1 text-xs">
              Network
            </TabsTrigger>
            {showSqlLocaldbSettingsCard ? (
              <TabsTrigger value="sqllocaldb" className="px-2 py-1 text-xs">
                SqlLocalDB
              </TabsTrigger>
            ) : null}
          </TabsList>

          <TabsContent value="overview" className="mt-0 space-y-3">
            <ManifestSummaryCards settings={settings} loadingSettings={loadingSettings} />
            {settings ? <PathsGrid settings={settings} /> : null}
          </TabsContent>

          <TabsContent value="appearance" className="mt-0">
            <AppearanceCard mounted={mounted} theme={theme} setTheme={setTheme} />
          </TabsContent>

          <TabsContent value="network" className="mt-0">
            <PortValidationCard
              httpPort={httpPort}
              onHttpPortChange={(n) => {
                setHttpPort(n);
                setPortStatus("idle");
              }}
              portStatus={portStatus}
              onValidate={() => void validatePort()}
            />
          </TabsContent>

          {showSqlLocaldbSettingsCard ? (
            <TabsContent value="sqllocaldb" className="mt-0">
              <SqlLocaldbSettingsCard
                sqlLocaldbManaged={sqlLocaldbManaged}
                sqlLocaldbRuntimeReady={sqlLocaldbRuntimeReady}
                sqlLocaldbVersion={sqlLocaldbVersion}
                sqlLocaldbInstanceName={sqlLocaldbInstanceName}
                sqlLocaldbAction={sqlLocaldbAction}
                setSqlLocaldbAction={setSqlLocaldbAction}
                sqlLocaldbCreateInstance={sqlLocaldbCreateInstance}
                setSqlLocaldbCreateInstance={setSqlLocaldbCreateInstance}
                sqlLocaldbDeleteInstance={sqlLocaldbDeleteInstance}
                setSqlLocaldbDeleteInstance={setSqlLocaldbDeleteInstance}
                instanceOptions={instanceOptions}
                sqlLocaldbBusy={sqlLocaldbBusy}
                onCreateInstance={() => void onCreateSqlLocaldbInstance()}
                onDeleteInstance={() => void onDeleteSqlLocaldbInstance()}
                onUninstall={() => void onUninstallSqlLocaldb()}
              />
            </TabsContent>
          ) : null}
      </Tabs>
    </PanelShell>
  );
}
