import { useState } from "react";
import { Button } from "@/components/ui/button";
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
import { MutedCallout } from "@/components/MutedCallout";
import { ManagedStateBadge } from "@/features/settings/ManagedStateBadge";
import { Loader2, Trash2 } from "lucide-react";

export function SqlLocaldbUninstallPanel({
  managed,
  busy,
  onUninstall,
}: {
  managed: boolean;
  busy: boolean;
  onUninstall: () => void;
}) {
  const [confirmOpen, setConfirmOpen] = useState(false);

  const runUninstall = () => {
    onUninstall();
    setConfirmOpen(false);
  };

  return (
    <div className="space-y-3">
      <SectionHeader title="Uninstall" description="Only for installs performed by MewAMP." />

      <MutedCallout>
        {managed
          ? "This SqlLocalDB install is tracked by MewAMP and can be removed here."
          : "No app-managed SqlLocalDB install on this system."}
      </MutedCallout>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <ManagedStateBadge managed={managed} />

        <Button
          type="button"
          variant="outline"
          className="text-destructive hover:text-destructive"
          disabled={busy || !managed}
          onClick={() => setConfirmOpen(true)}
        >
          {busy ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Removing...
            </>
          ) : (
            <>
              <Trash2 className="mr-2 h-4 w-4" />
              Uninstall SqlLocalDB
            </>
          )}
        </Button>
      </div>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Uninstall SqlLocalDB?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes the MewAMP-managed SqlLocalDB runtime from this system. LocalDB instances and data may stop
              working until you reinstall. This action is not easily reversible from this app.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy}>Cancel</AlertDialogCancel>
            <AlertDialogAction variant="destructive" disabled={busy} onClick={() => runUninstall()}>
              Uninstall
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
