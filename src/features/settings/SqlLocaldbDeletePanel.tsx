import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Trash2 } from "lucide-react";

export function SqlLocaldbDeletePanel({
  instanceOptions,
  selectedInstance,
  onSelectedInstanceChange,
  busy,
  onSubmit,
}: {
  instanceOptions: string[];
  selectedInstance: string;
  onSelectedInstanceChange: (v: string) => void;
  busy: boolean;
  onSubmit: () => void;
}) {
  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <div className="font-medium">Delete instance</div>
        <p className="text-sm text-muted-foreground">Select an existing LocalDB instance to remove.</p>
      </div>

      <div className="rounded-xl border border-border/50 bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
        CLI output is written to <strong>Logs → SqlLocalDB</strong>.
      </div>

      <div className="space-y-2">
        <Label htmlFor="settings-sqllocaldb-delete-instance">Existing instance</Label>
        <Select value={selectedInstance} onValueChange={(v) => typeof v === "string" && onSelectedInstanceChange(v)}>
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
        disabled={busy || !selectedInstance.trim()}
        onClick={onSubmit}
      >
        {busy ? (
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
  );
}
