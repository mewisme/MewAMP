import { useEffect, useMemo, useRef, useState } from "react";
import {
  FileText,
  AppWindow,
  Wrench,
  Server,
  Database,
  RefreshCw,
  Copy,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getLog } from "@/lib/tauri-commands";
import { writeText } from "@tauri-apps/plugin-clipboard-manager";
import { toast } from "sonner";

type LogKey = "app" | "installer" | "apache" | "mariadb";
const AUTO_SCROLL_THRESHOLD_PX = 24;

export function LogsPanel() {
  const [activeTab, setActiveTab] = useState<LogKey>("app");
  const [logs, setLogs] = useState<Record<LogKey, string>>({
    app: "",
    installer: "",
    apache: "",
    mariadb: "",
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
  });

  const logRefs: Record<LogKey, React.RefObject<HTMLPreElement | null>> = {
    app: appLogRef,
    installer: installerLogRef,
    apache: apacheLogRef,
    mariadb: mariadbLogRef,
  };

  const logMeta: Array<{
    key: LogKey;
    label: string;
    empty: string;
    icon: React.ElementType;
  }> = useMemo(
    () => [
      { key: "app", label: "App", empty: "No app logs yet.", icon: AppWindow },
      { key: "installer", label: "Installer", empty: "No installer logs yet.", icon: Wrench },
      { key: "apache", label: "Apache", empty: "No Apache logs yet.", icon: Server },
      { key: "mariadb", label: "MariaDB", empty: "No MariaDB logs yet.", icon: Database },
    ],
    []
  );

  const loadLogs = async () => {
    setLoading(true);
    try {
      const [app, installer, apache, mariadb] = await Promise.all([
        getLog("app"),
        getLog("installer"),
        getLog("apache"),
        getLog("mariadb"),
      ]);

      setLogs({
        app,
        installer,
        apache,
        mariadb,
      });
    } catch (error) {
      console.error(error);
      toast.error("Failed to load logs.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
    const id = setInterval(loadLogs, 1000);
    return () => clearInterval(id);
  }, []);

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
                View live logs for the app, installer, Apache, and MariaDB.
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

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-xl"
                      onClick={loadLogs}
                      disabled={loading}
                    >
                      <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                      Refresh
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-xl"
                      onClick={() => copyLog(text, item.label)}
                    >
                      <Copy className="mr-2 h-4 w-4" />
                      Copy Log
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