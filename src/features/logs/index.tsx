import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import {
  FileText,
  AppWindow,
  Wrench,
  Server,
  Database,
  RefreshCw,
  Copy,
  Trash2,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { clearLogFile, getLog } from "@/lib/tauri-commands";
import { writeText } from "@tauri-apps/plugin-clipboard-manager";
import { toast } from "sonner";
import { platform } from "@tauri-apps/plugin-os";
import { useSqlLocaldbRuntimeInit } from "@/features/sql-localdb/use-sql-localdb-runtime";

export type LogPanelTab = "app" | "installer" | "apache" | "mariadb" | "sqllocaldb";

type LogKey = LogPanelTab;
const AUTO_SCROLL_THRESHOLD_PX = 24;

export function LogsPanel() {
  const location = useLocation();
  const osIsWindows = platform() === "windows";
  const { sqlLocaldbRuntimeReady } = useSqlLocaldbRuntimeInit();
  const showSqlLocaldbLogTab = osIsWindows && sqlLocaldbRuntimeReady;
  const [activeTab, setActiveTab] = useState<LogKey>("app");
  const [logs, setLogs] = useState<Record<LogKey, string>>({
    app: "",
    installer: "",
    apache: "",
    mariadb: "",
    sqllocaldb: "",
  });

  const [loading, setLoading] = useState(false);

  const appLogRef = useRef<HTMLPreElement | null>(null);
  const installerLogRef = useRef<HTMLPreElement | null>(null);
  const apacheLogRef = useRef<HTMLPreElement | null>(null);
  const mariadbLogRef = useRef<HTMLPreElement | null>(null);
  const shouldStickToBottomRef = useRef<Record<LogKey, boolean>>({
    app: true,
    installer: true,
    apache: true,
    mariadb: true,
    sqllocaldb: true,
  });

  const sqllocaldbLogRef = useRef<HTMLPreElement | null>(null);

  const logRefs: Record<LogKey, React.RefObject<HTMLPreElement | null>> = {
    app: appLogRef,
    installer: installerLogRef,
    apache: apacheLogRef,
    mariadb: mariadbLogRef,
    sqllocaldb: sqllocaldbLogRef,
  };

  const logMeta: Array<{
    key: LogKey;
    label: string;
    empty: string;
    icon: React.ElementType;
  }> = useMemo(() => {
    const base: Array<{
      key: LogKey;
      label: string;
      empty: string;
      icon: React.ElementType;
    }> = [
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
  }, [showSqlLocaldbLogTab]);

  useEffect(() => {
    const tab = (location.state as { activeLogTab?: LogKey } | null)?.activeLogTab;
    const allowSql = tab === "sqllocaldb" && showSqlLocaldbLogTab;
    if (tab === "app" || tab === "installer" || tab === "apache" || tab === "mariadb" || allowSql) {
      setActiveTab(tab);
    }
  }, [location.state, showSqlLocaldbLogTab]);

  useEffect(() => {
    if (activeTab === "sqllocaldb" && !showSqlLocaldbLogTab) {
      setActiveTab("app");
    }
  }, [activeTab, showSqlLocaldbLogTab]);

  const loadLogs = useCallback(async () => {
    setLoading(true);
    try {
      const [app, installer, apache, mariadb, sqllocaldb] = await Promise.all([
        getLog("app"),
        getLog("installer"),
        getLog("apache"),
        getLog("mariadb"),
        showSqlLocaldbLogTab ? getLog("sqllocaldb") : Promise.resolve(""),
      ]);

      setLogs({
        app,
        installer,
        apache,
        mariadb,
        sqllocaldb,
      });
    } catch (error) {
      console.error(error);
      toast.error("Failed to load logs.");
    } finally {
      setLoading(false);
    }
  }, [showSqlLocaldbLogTab]);

  useEffect(() => {
    void loadLogs();
    const id = setInterval(() => void loadLogs(), 1000);
    return () => clearInterval(id);
  }, [loadLogs]);

  useEffect(() => {
    const ref = logRefs[activeTab]?.current;
    if (ref && shouldStickToBottomRef.current[activeTab]) {
      ref.scrollTop = ref.scrollHeight;
    }
  }, [activeTab, logs, logRefs]);

  const handleLogScroll = (key: LogKey) => {
    const ref = logRefs[key]?.current;
    if (!ref) return;
    const distanceFromBottom = ref.scrollHeight - ref.scrollTop - ref.clientHeight;
    shouldStickToBottomRef.current[key] = distanceFromBottom <= AUTO_SCROLL_THRESHOLD_PX;
  };

  const copyLog = async (text: string, label: string) => {
    try {
      await writeText(text || "");
      toast.success(`${label} log copied.`);
    } catch (error) {
      console.error(error);
      toast.error(`Failed to copy ${label.toLowerCase()} log.`);
    }
  };

  const clearLogForTab = async (key: LogKey, label: string) => {
    try {
      await clearLogFile(key);
      setLogs((prev) => ({ ...prev, [key]: "" }));
      toast.success(`${label} log cleared.`);
    } catch (error) {
      console.error(error);
      toast.error(`Failed to clear ${label.toLowerCase()} log.`);
    }
  };

  return (
    <Card className="rounded-2xl border-border/60 bg-card/80 shadow-sm backdrop-blur-sm">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-muted">
              <FileText className="h-5 w-5 text-muted-foreground" />
            </div>

            <div>
              <CardTitle className="text-lg leading-tight">Logs</CardTitle>
              <CardDescription className="mt-1">
                View live logs for the app, installer, Apache, MariaDB, and SqlLocalDB CLI output.
              </CardDescription>
            </div>
          </div>

          <Badge variant="outline" className="rounded-full px-2.5 py-1 text-xs">
            Live refresh 1s
          </Badge>
        </div>
      </CardHeader>

      <CardContent>
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as LogKey)} className="space-y-4">
          <TabsList className="h-auto w-full justify-start gap-2 rounded-2xl bg-muted/40 p-0 flex-wrap">
            {logMeta.map((item) => {
              const Icon = item.icon;

              return (
                <TabsTrigger
                  key={item.key}
                  value={item.key}
                  className="rounded-xl data-[state=active]:shadow-none p-4"
                >
                  <Icon className="mr-2 h-4 w-4" />
                  {item.label}
                </TabsTrigger>
              );
            })}
          </TabsList>

          {logMeta.map((item) => {
            const Icon = item.icon;
            const text = logs[item.key];

            return (
              <TabsContent key={item.key} value={item.key} className="mt-0 space-y-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-muted">
                      <Icon className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div>
                      <div className="font-medium">{item.label} Log</div>
                      <p className="text-sm text-muted-foreground">
                        Latest output captured from the {item.label.toLowerCase()} process.
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="icon-sm"
                      className="rounded-xl"
                      onClick={loadLogs}
                      disabled={loading}
                      title="Refresh"
                      aria-label={`Refresh ${item.label} log`}
                    >
                      <RefreshCw className={loading ? "animate-spin" : ""} />
                    </Button>

                    <Button
                      type="button"
                      variant="outline"
                      size="icon-sm"
                      className="rounded-xl"
                      onClick={() => copyLog(text, item.label)}
                      title="Copy log"
                      aria-label={`Copy ${item.label} log to clipboard`}
                    >
                      <Copy />
                    </Button>

                    <Button
                      type="button"
                      variant="outline"
                      size="icon-sm"
                      className="rounded-xl text-destructive hover:text-destructive"
                      onClick={() => void clearLogForTab(item.key, item.label)}
                      title="Clear log"
                      aria-label={`Clear ${item.label} log file`}
                    >
                      <Trash2 />
                    </Button>
                  </div>
                </div>

                <div className="rounded-2xl border border-border/60 bg-muted/20 p-1">
                  <pre
                    ref={logRefs[item.key]}
                    onScroll={() => handleLogScroll(item.key)}
                    className="max-h-[60vh] overflow-auto whitespace-pre-wrap break-words rounded-xl bg-background/60 p-4 text-xs leading-6"
                  >
                    {text || item.empty}
                  </pre>
                </div>
              </TabsContent>
            );
          })}
        </Tabs>
      </CardContent>
    </Card>
  );
}