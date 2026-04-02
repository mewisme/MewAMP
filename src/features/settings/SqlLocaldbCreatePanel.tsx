import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SectionHeader } from "@/components/SectionHeader";
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
    <div className="space-y-3">
      <SectionHeader title="Create instance" description="New LocalDB instance name." />

      <div className="space-y-1.5">
        <Label className="text-xs" htmlFor="settings-sqllocaldb-create-instance">
          Instance name
        </Label>
        <Input
          id="settings-sqllocaldb-create-instance"
          value={instanceName}
          onChange={(e) => onInstanceNameChange(e.target.value)}
          placeholder="MewAMP"
          className="font-mono text-xs"
        />
      </div>

      <Button type="button" disabled={busy || !instanceName.trim()} onClick={onSubmit}>
        {busy ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Working...
          </>
        ) : (
          <>
            <Plus className="mr-2 h-4 w-4" />
            Create instance
          </>
        )}
      </Button>
    </div>
  );
}
