import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { platform } from "@tauri-apps/plugin-os";
import {
  CheckCircle2,
  Package,
  Settings2,
  Server,
  AlertCircle,
  Loader2,
  Moon,
  Sun,
  Monitor,
  Palette,
  Check,
  Trash2,
  Database,
  Wrench,
  Plus,
} from "lucide-react";
import { useTheme } from "next-themes";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  checkPorts,
  getInstallState,
  sqlLocaldbCli,
  uninstallAppManagedSqlLocaldb,
} from "@/lib/tauri-commands";
import { useSqlLocaldbInstanceOptions } from "@/features/sql-localdb/use-sql-localdb-instance-options";
import { useSqlLocaldbRuntimeInit } from "@/features/sql-localdb/use-sql-localdb-runtime";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type Settings = {
  runtime_root: string;
  data_root: string;
  config_root: string;
  selected_manifest_source: string;
  selected_manifest_version: string;
};

type PortStatus = "idle" | "checking" | "available" | "in_use";
type SqlLocalDbAction = "create" | "delete" | "uninstall";

export function SettingsPanel() {
  const [settings, setSettings] = useState<Settings | null>(null);
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
    sqlLocaldbRuntimeReady,
  );

  const { theme, setTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const loadSettings = async () => {
      setLoadingSettings(true);
      try {
        const result = await invoke<Settings>("get_app_settings");
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
        <div className="grid gap-4 md:grid-cols-2">
          <SummaryTile
            icon={Package}
            label="Manifest Source"
            value={loadingSettings ? "Loading..." : settings?.selected_manifest_source || "Not available"}
          />

          <SummaryTile
            icon={Server}
            label="Manifest Version"
            value={loadingSettings ? "Loading..." : settings?.selected_manifest_version || "Not available"}
          />
        </div>

        {showSqlLocaldbSettingsCard && (
          <Card className="rounded-2xl border-border/60 shadow-none">
            <CardContent className="space-y-4 p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-muted">
                    <Database className="h-4 w-4 text-muted-foreground" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="font-medium">SqlLocalDB</div>
                    <p className="text-sm text-muted-foreground">
                      Manage the optional Microsoft SQL Express LocalDB runtime and its local instances.
                    </p>
                  </div>
                </div>

                <Badge variant="outline" className="rounded-full px-3 py-1 text-xs">
                  Windows only
                </Badge>
              </div>

              <div className="rounded-xl border border-border/50 bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
                {sqlLocaldbManaged ? (
                  <>
                    Managed install detected
                    {sqlLocaldbVersion ? (
                      <>
                        {" "}— version <span className="font-mono text-foreground">{sqlLocaldbVersion}</span>
                      </>
                    ) : null}
                    {sqlLocaldbInstanceName ? (
                      <>
                        {", "}instance <span className="font-mono text-foreground">{sqlLocaldbInstanceName}</span>
                      </>
                    ) : null}
                    .
                  </>
                ) : sqlLocaldbRuntimeReady ? (
                  "SqlLocalDB runtime is available on this system, but no app-managed install record was found."
                ) : (
                  "No app-managed SqlLocalDB install is currently recorded."
                )}
              </div>

              <div className="grid gap-2 sm:grid-cols-3">
                {sqlLocaldbRuntimeReady && (
                  <ActionOption
                    icon={Plus}
                    label="Create Instance"
                    active={sqlLocaldbAction === "create"}
                    onClick={() => setSqlLocaldbAction("create")}
                  />
                )}

                {sqlLocaldbRuntimeReady && (
                  <ActionOption
                    icon={Wrench}
                    label="Delete Instance"
                    active={sqlLocaldbAction === "delete"}
                    onClick={() => setSqlLocaldbAction("delete")}
                  />
                )}

                {sqlLocaldbManaged && (
                  <ActionOption
                    icon={Trash2}
                    label="Uninstall"
                    active={sqlLocaldbAction === "uninstall"}
                    onClick={() => setSqlLocaldbAction("uninstall")}
                    destructive
                  />
                )}
              </div>

              <div className="rounded-2xl border border-border/60 bg-background/40 p-5">
                {sqlLocaldbAction === "create" && sqlLocaldbRuntimeReady && (
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <div className="font-medium">Create instance</div>
                      <p className="text-sm text-muted-foreground">
                        Enter a new LocalDB instance name to create.
                      </p>
                    </div>

                    <div className="rounded-xl border border-border/50 bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
                      CLI output is written to <strong>Logs → SqlLocalDB</strong>.
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="settings-sqllocaldb-create-instance">Instance name</Label>
                      <Input
                        id="settings-sqllocaldb-create-instance"
                        value={sqlLocaldbCreateInstance}
                        onChange={(e) => setSqlLocaldbCreateInstance(e.target.value)}
                        placeholder="MewAMP"
                        className="h-11 rounded-xl font-mono text-sm"
                      />
                    </div>

                    <Button
                      type="button"
                      className="h-11 rounded-xl"
                      disabled={sqlLocaldbBusy || !sqlLocaldbCreateInstance.trim()}
                      onClick={() => void onCreateSqlLocaldbInstance()}
                    >
                      {sqlLocaldbBusy ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Working...
                        </>
                      ) : (
                        <>
                          <Plus className="mr-2 h-4 w-4" />
                          Create Instance
                        </>
                      )}
                    </Button>
                  </div>
                )}

                {sqlLocaldbAction === "delete" && sqlLocaldbRuntimeReady && (
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <div className="font-medium">Delete instance</div>
                      <p className="text-sm text-muted-foreground">
                        Select an existing LocalDB instance to remove.
                      </p>
                    </div>

                    <div className="rounded-xl border border-border/50 bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
                      CLI output is written to <strong>Logs → SqlLocalDB</strong>.
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="settings-sqllocaldb-delete-instance">Existing instance</Label>
                      <Select
                        value={sqlLocaldbDeleteInstance}
                        onValueChange={(v) => {
                          if (typeof v === "string") setSqlLocaldbDeleteInstance(v);
                        }}
                      >
                        <SelectTrigger
                          id="settings-sqllocaldb-delete-instance"
                          className="h-11 w-full rounded-xl font-mono text-sm"
                          size="default"
                        >
                          <SelectValue placeholder="Select instance" />
                        </SelectTrigger>

                        <SelectContent className="rounded-xl">
                          {instanceOptions.map((name) => (
                            <SelectItem key={name} value={name} className="rounded-lg font-mono text-sm">
                              {name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <Button
                      type="button"
                      variant="destructive"
                      className="h-11 rounded-xl"
                      disabled={sqlLocaldbBusy || !sqlLocaldbDeleteInstance.trim()}
                      onClick={() => void onDeleteSqlLocaldbInstance()}
                    >
                      {sqlLocaldbBusy ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Working...
                        </>
                      ) : (
                        <>
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete Instance
                        </>
                      )}
                    </Button>
                  </div>
                )}

                {sqlLocaldbAction === "uninstall" && sqlLocaldbManaged && (
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <div className="font-medium">Uninstall SqlLocalDB</div>
                      <p className="text-sm text-muted-foreground">
                        Remove SqlLocalDB only when it was installed by MewAMP.
                      </p>
                    </div>

                    <div className="rounded-xl border border-border/50 bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
                      {sqlLocaldbManaged
                        ? "This SqlLocalDB install is tracked by MewAMP and can be removed safely here."
                        : "This system does not currently have an app-managed SqlLocalDB install."}
                    </div>

                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <ManagedStateBadge managed={sqlLocaldbManaged} />

                      <Button
                        type="button"
                        variant="outline"
                        className="rounded-xl text-destructive hover:text-destructive"
                        disabled={sqlLocaldbBusy || !sqlLocaldbManaged}
                        onClick={() => void onUninstallSqlLocaldb()}
                      >
                        {sqlLocaldbBusy ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Removing...
                          </>
                        ) : (
                          <>
                            <Trash2 className="mr-2 h-4 w-4" />
                            Uninstall SqlLocalDB
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="rounded-2xl border-border/60 shadow-none">
          <CardContent className="space-y-4 p-5">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-muted">
                <Palette className="h-4 w-4 text-muted-foreground" />
              </div>

              <div className="min-w-0 flex-1">
                <div className="font-medium">Appearance</div>
                <p className="text-sm text-muted-foreground">
                  Choose how MewAMP looks across the app.
                </p>
              </div>
            </div>

            {mounted ? (
              <div className="grid gap-2 sm:grid-cols-3">
                <ThemeOption
                  icon={Sun}
                  label="Light"
                  active={theme === "light"}
                  onClick={() => setTheme("light")}
                />
                <ThemeOption
                  icon={Moon}
                  label="Dark"
                  active={theme === "dark"}
                  onClick={() => setTheme("dark")}
                />
                <ThemeOption
                  icon={Monitor}
                  label="System"
                  active={theme === "system"}
                  onClick={() => setTheme("system")}
                />
              </div>
            ) : (
              <div className="grid gap-2 sm:grid-cols-3">
                <div className="h-11 rounded-xl border border-border/60 bg-muted/20" />
                <div className="h-11 rounded-xl border border-border/60 bg-muted/20" />
                <div className="h-11 rounded-xl border border-border/60 bg-muted/20" />
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border/60 shadow-none">
          <CardContent className="space-y-4 p-5">
            <div className="space-y-1">
              <div className="font-medium">HTTP Port Validation</div>
              <p className="text-sm text-muted-foreground">
                Check whether the selected local HTTP port is free before applying it.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="http-port">HTTP Port</Label>
              <Input
                id="http-port"
                type="number"
                value={httpPort}
                onChange={(e) => {
                  setHttpPort(Number(e.target.value));
                  setPortStatus("idle");
                }}
              />
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <Button
                onClick={validatePort}
                disabled={portStatus === "checking"}
                className="h-11 rounded-xl"
              >
                {portStatus === "checking" ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Checking...
                  </>
                ) : (
                  "Validate Port"
                )}
              </Button>

              <PortStatusBadge status={portStatus} />
            </div>
          </CardContent>
        </Card>

        {settings && (
          <div className="grid gap-4 md:grid-cols-3">
            <PathTile label="Runtime Root" value={settings.runtime_root} />
            <PathTile label="Data Root" value={settings.data_root} />
            <PathTile label="Config Root" value={settings.config_root} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function SummaryTile({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
}) {
  return (
    <Card className="rounded-2xl border-border/60 shadow-none">
      <CardContent className="flex items-start gap-3 p-5">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-muted">
          <Icon className="h-4 w-4 text-muted-foreground" />
        </div>

        <div className="min-w-0">
          <div className="text-sm text-muted-foreground">{label}</div>
          <div className="truncate font-medium">{value}</div>
        </div>
      </CardContent>
    </Card>
  );
}

function PathTile({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <Card className="rounded-2xl border-border/60 shadow-none">
      <CardContent className="space-y-2 p-5">
        <div className="text-sm text-muted-foreground">{label}</div>
        <div className="break-all text-sm font-medium">{value || "Not set"}</div>
      </CardContent>
    </Card>
  );
}

function ThemeOption({
  icon: Icon,
  label,
  active,
  onClick,
}: {
  icon: React.ElementType;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <Button
      type="button"
      variant="outline"
      onClick={onClick}
      className={cn(
        "h-auto min-h-12 justify-between rounded-xl px-4 py-3",
        active ? "border-primary/30 bg-primary/10 text-foreground" : "text-muted-foreground"
      )}
    >
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 shrink-0" />
        <span>{label}</span>
      </div>

      {active ? (
        <div className="flex items-center gap-1 text-xs font-medium text-primary">
          <Check className="h-4 w-4" />
          <span>Selected</span>
        </div>
      ) : null}
    </Button>
  );
}

function ActionOption({
  icon: Icon,
  label,
  active,
  onClick,
  destructive = false,
}: {
  icon: React.ElementType;
  label: string;
  active: boolean;
  onClick: () => void;
  destructive?: boolean;
}) {
  return (
    <Button
      type="button"
      variant="outline"
      onClick={onClick}
      className={cn(
        "h-11 justify-start rounded-xl px-4",
        active && !destructive && "border-primary/30 bg-primary/10 text-foreground",
        active && destructive && "border-destructive/30 bg-destructive/10 text-destructive",
        !active && destructive && "text-destructive hover:text-destructive"
      )}
    >
      <Icon className="mr-2 h-4 w-4 shrink-0" />
      <span>{label}</span>
    </Button>
  );
}

function ManagedStateBadge({ managed }: { managed: boolean }) {
  if (managed) {
    return (
      <Badge
        variant="outline"
        className="rounded-full border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs text-emerald-600 dark:text-emerald-400"
      >
        <CheckCircle2 className="mr-1 h-3.5 w-3.5" />
        Managed by MewAMP
      </Badge>
    );
  }

  return (
    <Badge variant="outline" className="rounded-full px-3 py-1 text-xs text-muted-foreground">
      Not managed by app
    </Badge>
  );
}

function PortStatusBadge({ status }: { status: PortStatus }) {
  if (status === "idle") {
    return (
      <Badge variant="outline" className="rounded-full px-3 py-1 text-xs text-muted-foreground">
        Not checked
      </Badge>
    );
  }

  if (status === "checking") {
    return (
      <Badge variant="outline" className="rounded-full px-3 py-1 text-xs">
        Checking...
      </Badge>
    );
  }

  if (status === "available") {
    return (
      <Badge
        variant="outline"
        className="rounded-full border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs text-emerald-600 dark:text-emerald-400"
      >
        <CheckCircle2 className="mr-1 h-3.5 w-3.5" />
        Available
      </Badge>
    );
  }

  return (
    <Badge
      variant="outline"
      className="rounded-full border-amber-500/20 bg-amber-500/10 px-3 py-1 text-xs text-amber-600 dark:text-amber-400"
    >
      <AlertCircle className="mr-1 h-3.5 w-3.5" />
      In use
    </Badge>
  );
}