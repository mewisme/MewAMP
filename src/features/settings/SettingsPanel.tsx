import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { platform } from "@tauri-apps/plugin-os";
import { useTheme } from "next-themes";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings2 } from "lucide-react";
import { checkPorts, getInstallState, sqlLocaldbCli, uninstallAppManagedSqlLocaldb } from "@/lib/tauri-commands";
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

  const [sqlLocaldbBusy, setSqlLocaldbBusy] = useState(false);
  const [sqlLocaldbManaged, setSqlLocaldbManaged] = useState(false);
  const [sqlLocaldbVersion, setSqlLocaldbVersion] = useState<string | null>(null);
  const [sqlLocaldbInstanceName, setSqlLocaldbInstanceName] = useState<string | null>(null);
  const [sqlLocaldbCreateInstance, setSqlLocaldbCreateInstance] = useState("MewAMP");
  const [sqlLocaldbDeleteInstance, setSqlLocaldbDeleteInstance] = useState("");
  const [sqlLocaldbAction, setSqlLocaldbAction] = useState<SqlLocalDbAction>("create");

  const osIsWindows = platform() === "windows";
  const { sqlLocaldbRuntimeReady, recheckSqlLocaldbRuntime } = useSqlLocaldbRuntimeInit();
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
    if (!osIsWindows) return;

    const load = async () => {
      try {
        const st = await getInstallState();
        const rec = st.sql_localdb;
        setSqlLocaldbManaged(Boolean(rec?.installed_by_app));
        setSqlLocaldbVersion(rec?.version ?? null);
        setSqlLocaldbInstanceName(rec?.instance_name?.trim() || null);
      } catch (error) {
        console.error(error);
      }
    };

    void load();
  }, [osIsWindows]);

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
      setSqlLocaldbManaged(false);
      setSqlLocaldbVersion(null);
      setSqlLocaldbInstanceName(null);
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
    <Card className="rounded-2xl border-border/60 bg-card/80 shadow-sm backdrop-blur-sm">
      <CardHeader className="pb-4">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-muted">
            <Settings2 className="h-5 w-5 text-muted-foreground" />
          </div>

          <div>
            <CardTitle className="text-lg leading-tight">Settings</CardTitle>
            <CardDescription className="mt-1">
              Review manifest details, appearance, and validate local service ports.
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <ManifestSummaryCards settings={settings} loadingSettings={loadingSettings} />

        {showSqlLocaldbSettingsCard && (
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
        )}

        <AppearanceCard mounted={mounted} theme={theme} setTheme={setTheme} />

        <PortValidationCard
          httpPort={httpPort}
          onHttpPortChange={(n) => {
            setHttpPort(n);
            setPortStatus("idle");
          }}
          portStatus={portStatus}
          onValidate={() => void validatePort()}
        />

        {settings && <PathsGrid settings={settings} />}
      </CardContent>
    </Card>
  );
}
