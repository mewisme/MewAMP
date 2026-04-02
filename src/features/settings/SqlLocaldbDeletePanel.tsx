import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { SectionHeader } from "@/components/SectionHeader";
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
  const [confirmOpen, setConfirmOpen] = useState(false);

  const runDelete = () => {
    onSubmit();
    setConfirmOpen(false);
  };

  return (
    <div className="space-y-3">
      <SectionHeader title="Delete instance" description="Remove an existing LocalDB instance." />

      <div className="space-y-1.5">
        <Label className="text-xs" htmlFor="settings-sqllocaldb-delete-instance">
          Instance
        </Label>
        <Select value={selectedInstance} onValueChange={(v) => typeof v === "string" && onSelectedInstanceChange(v)}>
          <SelectTrigger id="settings-sqllocaldb-delete-instance" className="w-full font-mono text-xs" size="default">
            <SelectValue placeholder="Select instance" />
          </SelectTrigger>

          <SelectContent>
            {instanceOptions.map((name) => (
              <SelectItem key={name} value={name} className="font-mono text-xs">
                {name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Button
        type="button"
        variant="destructive"
        disabled={busy || !selectedInstance.trim()}
        onClick={() => setConfirmOpen(true)}
      >
        {busy ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Working...
          </>
        ) : (
          <>
            <Trash2 className="mr-2 h-4 w-4" />
            Delete instance
          </>
        )}
      </Button>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete LocalDB instance?</AlertDialogTitle>
            <AlertDialogDescription>
              Instance <span className="font-mono text-foreground">{selectedInstance.trim() || "(none)"}</span> will be
              removed from this machine. This cannot be undone from MewAMP. Databases hosted only on that instance may
              become inaccessible until you recreate or restore them.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy}>Cancel</AlertDialogCancel>
            <AlertDialogAction variant="destructive" disabled={busy || !selectedInstance.trim()} onClick={() => runDelete()}>
              Delete permanently
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
