import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ActionOption } from "@/features/settings/ActionOption";
import { SqlLocaldbCreatePanel } from "@/features/settings/SqlLocaldbCreatePanel";
import { SqlLocaldbDeletePanel } from "@/features/settings/SqlLocaldbDeletePanel";
import { SqlLocaldbUninstallPanel } from "@/features/settings/SqlLocaldbUninstallPanel";
import type { SqlLocalDbAction } from "@/features/settings/types";
import { Database, Plus, Trash2, Wrench } from "lucide-react";

export function SqlLocaldbSettingsCard({
  sqlLocaldbManaged,
  sqlLocaldbRuntimeReady,
  sqlLocaldbVersion,
  sqlLocaldbInstanceName,
  sqlLocaldbAction,
  setSqlLocaldbAction,
  sqlLocaldbCreateInstance,
  setSqlLocaldbCreateInstance,
  sqlLocaldbDeleteInstance,
  setSqlLocaldbDeleteInstance,
  instanceOptions,
  sqlLocaldbBusy,
  onCreateInstance,
  onDeleteInstance,
  onUninstall,
}: {
  sqlLocaldbManaged: boolean;
  sqlLocaldbRuntimeReady: boolean;
  sqlLocaldbVersion: string | null;
  sqlLocaldbInstanceName: string | null;
  sqlLocaldbAction: SqlLocalDbAction;
  setSqlLocaldbAction: (a: SqlLocalDbAction) => void;
  sqlLocaldbCreateInstance: string;
  setSqlLocaldbCreateInstance: (v: string) => void;
  sqlLocaldbDeleteInstance: string;
  setSqlLocaldbDeleteInstance: (v: string) => void;
  instanceOptions: string[];
  sqlLocaldbBusy: boolean;
  onCreateInstance: () => void;
  onDeleteInstance: () => void;
  onUninstall: () => void;
}) {
  return (
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
                  {" "}
                  — version <span className="font-mono text-foreground">{sqlLocaldbVersion}</span>
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
            <SqlLocaldbCreatePanel
              instanceName={sqlLocaldbCreateInstance}
              onInstanceNameChange={setSqlLocaldbCreateInstance}
              busy={sqlLocaldbBusy}
              onSubmit={onCreateInstance}
            />
          )}

          {sqlLocaldbAction === "delete" && sqlLocaldbRuntimeReady && (
            <SqlLocaldbDeletePanel
              instanceOptions={instanceOptions}
              selectedInstance={sqlLocaldbDeleteInstance}
              onSelectedInstanceChange={setSqlLocaldbDeleteInstance}
              busy={sqlLocaldbBusy}
              onSubmit={onDeleteInstance}
            />
          )}

          {sqlLocaldbAction === "uninstall" && sqlLocaldbManaged && (
            <SqlLocaldbUninstallPanel managed={sqlLocaldbManaged} busy={sqlLocaldbBusy} onUninstall={onUninstall} />
          )}
        </div>
      </CardContent>
    </Card>
  );
}
