import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { clearLogFile, getLog } from "@/lib/tauri-commands";
import { writeText } from "@tauri-apps/plugin-clipboard-manager";
import { toast } from "sonner";
import { platform } from "@tauri-apps/plugin-os";
import { useSqlLocaldbRuntimeInit } from "@/features/sql-localdb/use-sql-localdb-runtime";
import { AUTO_SCROLL_THRESHOLD_PX, type LogKey } from "@/features/logs/types";
import { buildLogMeta } from "@/features/logs/build-log-meta";
import { LogsHeader } from "@/features/logs/LogsHeader";
import { LogTabPane } from "@/features/logs/LogTabPane";

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
  const sqllocaldbLogRef = useRef<HTMLPreElement | null>(null);
  const shouldStickToBottomRef = useRef<Record<LogKey, boolean>>({
    app: true,
    installer: true,
    apache: true,
    mariadb: true,
    sqllocaldb: true,
  });

  const logRefs: Record<LogKey, React.RefObject<HTMLPreElement | null>> = {
    app: appLogRef,
    installer: installerLogRef,
    apache: apacheLogRef,
    mariadb: mariadbLogRef,
    sqllocaldb: sqllocaldbLogRef,
  };

  const logMeta = useMemo(() => buildLogMeta(showSqlLocaldbLogTab), [showSqlLocaldbLogTab]);

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

      setLogs({ app, installer, apache, mariadb, sqllocaldb });
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
      <LogsHeader />

      <CardContent>
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as LogKey)} className="space-y-4">
          <TabsList className="h-auto w-full flex-wrap justify-start gap-2 rounded-2xl bg-muted/40 p-0">
            {logMeta.map((item) => {
              const Icon = item.icon;
              return (
                <TabsTrigger key={item.key} value={item.key} className="rounded-xl p-4 data-[state=active]:shadow-none">
                  <Icon className="mr-2 h-4 w-4" />
                  {item.label}
                </TabsTrigger>
              );
            })}
          </TabsList>

          {logMeta.map((item) => (
            <LogTabPane
              key={item.key}
              tabKey={item.key}
              label={item.label}
              icon={item.icon}
              empty={item.empty}
              text={logs[item.key]}
              logRef={logRefs[item.key]}
              loading={loading}
              onScroll={() => handleLogScroll(item.key)}
              onRefresh={loadLogs}
              onCopy={() => void copyLog(logs[item.key], item.label)}
              onClear={() => void clearLogForTab(item.key, item.label)}
            />
          ))}
        </Tabs>
      </CardContent>
    </Card>
  );
}
