import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Globe, Database, FolderOpen, HardDrive, ScrollText, Settings2 } from "lucide-react";

export function QuickActionsCard({
  onOpenLocalhost,
  onOpenPhpMyAdmin,
  onOpenHtdocs,
  onOpenRuntime,
  onOpenConfig,
  onOpenLogFolder,
}: {
  onOpenLocalhost: () => void;
  onOpenPhpMyAdmin: () => void;
  onOpenHtdocs: () => void;
  onOpenRuntime: () => void;
  onOpenConfig: () => void;
  onOpenLogFolder: () => void;
}) {
  return (
    <Card className="border-border/60 bg-card/80 shadow-sm backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-lg">Quick Actions</CardTitle>
        <CardDescription>Open common web endpoints and local folders quickly.</CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted">
              <Globe className="h-4 w-4 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm font-semibold">Web</p>
              <p className="text-xs text-muted-foreground">Open local services in your browser</p>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <Button size="lg" className="h-14 justify-start rounded-xl px-4 text-left" onClick={onOpenLocalhost}>
              <div className="flex items-center gap-3">
                <Globe className="h-4 w-4 shrink-0" />
                <div className="flex flex-col items-start">
                  <span className="font-medium">Open Localhost</span>
                  <span className="text-xs opacity-80">Main local web entry</span>
                </div>
              </div>
            </Button>

            <Button
              size="lg"
              variant="outline"
              className="h-14 justify-start rounded-xl px-4 text-left"
              onClick={onOpenPhpMyAdmin}
            >
              <div className="flex items-center gap-3">
                <Database className="h-4 w-4 shrink-0" />
                <div className="flex flex-col items-start">
                  <span className="font-medium">Open PhpMyAdmin</span>
                  <span className="text-xs text-muted-foreground">Database admin panel</span>
                </div>
              </div>
            </Button>
          </div>
        </section>

        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted">
              <FolderOpen className="h-4 w-4 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm font-semibold">Files</p>
              <p className="text-xs text-muted-foreground">Open project and runtime directories</p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            <Button variant="outline" className="h-14 justify-start rounded-xl px-4 text-left" onClick={onOpenHtdocs}>
              <div className="flex items-center gap-3">
                <FolderOpen className="h-4 w-4 shrink-0" />
                <div className="flex flex-col items-start">
                  <span className="font-medium">Open htdocs</span>
                  <span className="text-xs text-muted-foreground">Web root directory</span>
                </div>
              </div>
            </Button>

            <Button variant="outline" className="h-14 justify-start rounded-xl px-4 text-left" onClick={onOpenRuntime}>
              <div className="flex items-center gap-3">
                <HardDrive className="h-4 w-4 shrink-0" />
                <div className="flex flex-col items-start">
                  <span className="font-medium">Open Runtime</span>
                  <span className="text-xs text-muted-foreground">Logs, temp, process data</span>
                </div>
              </div>
            </Button>

            <Button variant="outline" className="h-14 justify-start rounded-xl px-4 text-left" onClick={onOpenConfig}>
              <div className="flex items-center gap-3">
                <Settings2 className="h-4 w-4 shrink-0" />
                <div className="flex flex-col items-start">
                  <span className="font-medium">Open Config</span>
                  <span className="text-xs text-muted-foreground">Service configuration files</span>
                </div>
              </div>
            </Button>

            <Button variant="outline" className="h-14 justify-start rounded-xl px-4 text-left" onClick={onOpenLogFolder}>
              <div className="flex items-center gap-3">
                <ScrollText className="h-4 w-4 shrink-0" />
                <div className="flex flex-col items-start">
                  <span className="font-medium">Open Log Folder</span>
                  <span className="text-xs text-muted-foreground">App and service log files</span>
                </div>
              </div>
            </Button>
          </div>
        </section>
      </CardContent>
    </Card>
  );
}
