import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Plus } from "lucide-react";

export function SqlLocaldbCreatePanel({
  instanceName,
  onInstanceNameChange,
  busy,
  onSubmit,
}: {
  instanceName: string;
  onInstanceNameChange: (v: string) => void;
  busy: boolean;
  onSubmit: () => void;
}) {
  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <div className="font-medium">Create instance</div>
        <p className="text-sm text-muted-foreground">Enter a new LocalDB instance name to create.</p>
      </div>

      <div className="rounded-xl border border-border/50 bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
        CLI output is written to <strong>Logs → SqlLocalDB</strong>.
      </div>

      <div className="space-y-2">
        <Label htmlFor="settings-sqllocaldb-create-instance">Instance name</Label>
        <Input
          id="settings-sqllocaldb-create-instance"
          value={instanceName}
          onChange={(e) => onInstanceNameChange(e.target.value)}
          placeholder="MewAMP"
          className="h-11 rounded-xl font-mono text-sm"
        />
      </div>

      <Button
        type="button"
        className="h-11 rounded-xl"
        disabled={busy || !instanceName.trim()}
        onClick={onSubmit}
      >
        {busy ? (
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
  );
}
