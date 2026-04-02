import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MutedCallout } from "@/components/MutedCallout";
import { SectionHeader } from "@/components/SectionHeader";
import { SqlLocaldbCreatePanel } from "@/features/settings/SqlLocaldbCreatePanel";
import { SqlLocaldbDeletePanel } from "@/features/settings/SqlLocaldbDeletePanel";
import { SqlLocaldbUninstallPanel } from "@/features/settings/SqlLocaldbUninstallPanel";
import type { SqlLocalDbAction } from "@/features/settings/types";
import { Database } from "lucide-react";
import { cn } from "@/lib/utils";

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
    <Card className="rounded-xl border-border/60 shadow-none">
      <CardContent className="space-y-3 p-4">
        <SectionHeader
          className="w-full"
          icon={Database}
          title="SqlLocalDB"
          description="Optional Microsoft SQL Express LocalDB runtime and instances."
          trailing={
            <Badge variant="outline" className="shrink-0 text-[10px] font-normal">
              Windows
            </Badge>
          }
        />

        <MutedCallout>
          {sqlLocaldbManaged ? (
            <>
              Managed install
              {sqlLocaldbVersion ? (
                <>
                  {" "}
                  — <span className="font-mono text-foreground">{sqlLocaldbVersion}</span>
                </>
              ) : null}
              {sqlLocaldbInstanceName ? (
                <>
                  {", "}
                  <span className="font-mono text-foreground">{sqlLocaldbInstanceName}</span>
                </>
              ) : null}
              .
            </>
          ) : sqlLocaldbRuntimeReady ? (
            "Runtime is present; no app-managed install record."
          ) : (
            "No app-managed SqlLocalDB install recorded."
          )}
        </MutedCallout>

        <Tabs
          value={sqlLocaldbAction}
          onValueChange={(v) => setSqlLocaldbAction(v as SqlLocalDbAction)}
          className="gap-2"
        >
          <TabsList className="h-auto min-h-8 w-full flex-wrap justify-start gap-0.5 bg-muted/40 p-1">
            {sqlLocaldbRuntimeReady ? (
              <TabsTrigger value="create" className="px-2 py-1 text-xs">
                Create
              </TabsTrigger>
            ) : null}
            {sqlLocaldbRuntimeReady ? (
              <TabsTrigger value="delete" className="px-2 py-1 text-xs">
                Delete
              </TabsTrigger>
            ) : null}
            {sqlLocaldbManaged ? (
              <TabsTrigger
                value="uninstall"
                className={cn("px-2 py-1 text-xs", "text-destructive data-[state=active]:text-destructive")}
              >
                Uninstall
              </TabsTrigger>
            ) : null}
          </TabsList>

          <TabsContent value="create" className="mt-0 rounded-lg border border-border/50 bg-background/50 p-4">
            {sqlLocaldbRuntimeReady ? (
              <SqlLocaldbCreatePanel
                instanceName={sqlLocaldbCreateInstance}
                onInstanceNameChange={setSqlLocaldbCreateInstance}
                busy={sqlLocaldbBusy}
                onSubmit={onCreateInstance}
              />
            ) : null}
          </TabsContent>

          <TabsContent value="delete" className="mt-0 rounded-lg border border-border/50 bg-background/50 p-4">
            {sqlLocaldbRuntimeReady ? (
              <SqlLocaldbDeletePanel
                instanceOptions={instanceOptions}
                selectedInstance={sqlLocaldbDeleteInstance}
                onSelectedInstanceChange={setSqlLocaldbDeleteInstance}
                busy={sqlLocaldbBusy}
                onSubmit={onDeleteInstance}
              />
            ) : null}
          </TabsContent>

          <TabsContent value="uninstall" className="mt-0 rounded-lg border border-border/50 bg-background/50 p-4">
            {sqlLocaldbManaged ? (
              <SqlLocaldbUninstallPanel managed={sqlLocaldbManaged} busy={sqlLocaldbBusy} onUninstall={onUninstall} />
            ) : null}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
