import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SQL_LOCALDB_INSTANCE_PATTERN } from "@/features/setup/constants";
import { SETUP_MODULE_REGISTRY } from "@/features/setup/modules/registry";
import type { SqlLocalDbModuleConfig } from "@/stores/setup";
import type { SqlLocalDbManifestEntry } from "@/lib/tauri-commands";
import { Loader2 } from "lucide-react";

const mod = SETUP_MODULE_REGISTRY.sqllocaldb;
const ModIcon = mod.icon;

export function SqlLocalDbConfigCard({
  modConfig,
  setModConfig,
  entries,
  entriesLoading,
  manifestError,
}: {
  modConfig: SqlLocalDbModuleConfig;
  setModConfig: (c: SqlLocalDbModuleConfig) => void;
  entries: SqlLocalDbManifestEntry[];
  entriesLoading: boolean;
  manifestError: string | null;
}) {
  return (
    <Card className="rounded-2xl border-border/60 shadow-none">
      <CardHeader className="pb-2">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-muted">
            <ModIcon className="h-5 w-5 text-muted-foreground" />
          </div>
          <div className="min-w-0 space-y-1">
            <CardTitle className="text-lg">{mod.title}</CardTitle>
            <CardDescription>{mod.shortDescription}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {manifestError && (
          <Alert variant="destructive" className="rounded-2xl">
            <AlertTitle>SqlLocalDB manifest</AlertTitle>
            <AlertDescription>{manifestError}</AlertDescription>
          </Alert>
        )}

        {entriesLoading && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading SqlLocalDB versions from the manifest…
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2 sm:items-start">
          <div className="min-w-0 space-y-2">
            <Label className="text-sm text-muted-foreground">LocalDB release year</Label>
            <Select
              value={modConfig.sqlLocaldbVersion}
              onValueChange={(v) => {
                if (typeof v === "string" && v) {
                  setModConfig({ ...modConfig, sqlLocaldbVersion: v });
                }
              }}
              disabled={entries.length === 0 || !!manifestError}
            >
              <SelectTrigger className="w-full rounded-xl" size="default">
                <SelectValue placeholder="Select SqlLocalDB year" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                {entries.map((e) => (
                  <SelectItem key={e.manifestKey} value={e.releaseYear} className="rounded-lg">
                    {e.releaseYear}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="min-w-0 space-y-2">
            <Label className="text-sm text-muted-foreground" htmlFor="sqllocaldb-instance-mod">
              Instance name
            </Label>
            <Input
              id="sqllocaldb-instance-mod"
              className="w-full rounded-xl font-mono text-sm"
              value={modConfig.sqlLocaldbInstanceName}
              placeholder="MewAMP"
              autoComplete="off"
              spellCheck={false}
              onChange={(e) => setModConfig({ ...modConfig, sqlLocaldbInstanceName: e.target.value })}
            />
            <p className="line-clamp-2 text-xs leading-snug text-muted-foreground">
              Used with <code className="text-xs">sqllocaldb create &quot;name&quot;</code> after install. Only letters, digits,
              and underscores.
            </p>
            {modConfig.sqlLocaldbInstanceName.trim() !== "" &&
              !SQL_LOCALDB_INSTANCE_PATTERN.test(modConfig.sqlLocaldbInstanceName.trim()) && (
                <p className="text-xs text-destructive">Invalid instance name.</p>
              )}
          </div>
        </div>

        <div className="flex items-start justify-between gap-4 rounded-xl border border-border/60 bg-muted/20 p-4">
          <div className="space-y-1">
            <div className="font-medium">Force reinstall MSI</div>
            <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
              Redownload and run the MSI even when the same version is already recorded for this app.
            </p>
          </div>
          <Switch
            checked={modConfig.forceReinstall}
            onCheckedChange={(checked) => setModConfig({ ...modConfig, forceReinstall: checked })}
          />
        </div>
      </CardContent>
    </Card>
  );
}
