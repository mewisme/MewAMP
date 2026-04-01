import { getVersion } from "@tauri-apps/api/app";
import { relaunch } from "@tauri-apps/plugin-process";
import { check, type DownloadEvent } from "@tauri-apps/plugin-updater";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

enum UpdateStatus {
  CHECKING = "CHECKING",
  AVAILABLE = "AVAILABLE",
  LATEST = "LATEST",
  ERROR = "ERROR",
}

interface UpdateInfo {
  status: UpdateStatus;
  currentVersion: string;
  newVersion?: string;
  error?: string;
}

export function VersionDisplay({ className }: { className?: string }) {
  const [version, setVersion] = useState("");
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo>({
    status: UpdateStatus.CHECKING,
    currentVersion: "",
  });
  const [showUpdateDialog, setShowUpdateDialog] = useState(false);
  const [updateProgress, setUpdateProgress] = useState(0);
  const [isUpdating, setIsUpdating] = useState(false);

  const checkForUpdates = async () => {
    try {
      setUpdateInfo((prev) => ({ ...prev, status: UpdateStatus.CHECKING }));
      const update = await check();

      if (update) {
        setUpdateInfo({
          status: UpdateStatus.AVAILABLE,
          currentVersion: version,
          newVersion: update.version,
        });
      } else {
        setUpdateInfo({
          status: UpdateStatus.LATEST,
          currentVersion: version,
        });
      }
    } catch (error) {
      setUpdateInfo({
        status: UpdateStatus.ERROR,
        currentVersion: version,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  };

  useEffect(() => {
    getVersion().then((currentVersion) => {
      setVersion(currentVersion);
      setUpdateInfo((prev) => ({ ...prev, currentVersion }));
    });

    void checkForUpdates();
    const interval = setInterval(() => {
      void checkForUpdates();
    }, 1000 * 60 * 60);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (showUpdateDialog) {
      void checkForUpdates();
    }
  }, [showUpdateDialog]);

  const handleUpdate = async () => {
    try {
      setIsUpdating(true);
      const update = await check();

      if (!update) {
        toast.error("No update available");
        return;
      }

      let downloaded = 0;
      let totalSize = 0;

      await update.downloadAndInstall((progress: DownloadEvent) => {
        switch (progress.event) {
          case "Started":
            if (progress.data.contentLength) {
              totalSize = progress.data.contentLength;
            }
            break;
          case "Progress":
            downloaded += progress.data.chunkLength;
            if (totalSize > 0) {
              const percent = (downloaded / totalSize) * 100;
              setUpdateProgress(percent);
            }
            break;
          default:
            break;
        }
      });

      toast.success("Update installed successfully");
      await relaunch();
    } catch (error) {
      toast.error(`Failed to update: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsUpdating(false);
      setShowUpdateDialog(false);
    }
  };

  const getStatusMessage = () => {
    switch (updateInfo.status) {
      case UpdateStatus.CHECKING:
        return (
          <div className="flex items-center justify-center gap-2">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-sky-500 border-t-transparent" />
            <span>Checking for updates...</span>
          </div>
        );
      case UpdateStatus.AVAILABLE:
        return <div className="text-center">A new version (v{updateInfo.newVersion}) is available!</div>;
      case UpdateStatus.LATEST:
        return <div className="text-center">You are running the latest version</div>;
      case UpdateStatus.ERROR:
        return <div className="text-center text-red-500">Failed to check updates: {updateInfo.error}</div>;
      default:
        return null;
    }
  };

  return (
    <>
      <div className={cn("flex items-center gap-2", className)}>
        <div
          className="relative cursor-pointer rounded px-1 py-0.5 text-xs text-muted-foreground hover:text-foreground"
          onClick={() => setShowUpdateDialog(true)}
        >
          {updateInfo.status === UpdateStatus.AVAILABLE && (
            <span className="absolute -right-3 top-1">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-sky-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-sky-500" />
              </span>
            </span>
          )}
          v{version}
        </div>
      </div>

      <Dialog open={showUpdateDialog} onOpenChange={setShowUpdateDialog}>
        <DialogContent className="w-[280px] rounded-xl bg-background backdrop-blur-sm [&>button]:cursor-pointer [&>button]:text-foreground [&>button:hover]:text-foreground/80">
          <div className="flex flex-col items-center gap-4 py-4">
            <div className="flex h-20 w-20 items-center justify-center rounded-xl bg-linear-to-br from-blue-500 to-blue-600">
              <img src="/tauri.svg" alt="App" className="h-12 w-12 object-contain" />
            </div>

            <div className="w-full space-y-3">
              <div className="space-y-0.5 text-center">
                <h2 className="text-xl font-semibold text-foreground">Tauri template</h2>
                <p className="text-xs text-gray-400">Version {version}</p>
              </div>

              <div className="py-1.5 text-xs text-foreground">{getStatusMessage()}</div>

              {isUpdating && (
                <div className="space-y-1.5 px-3">
                  <Progress value={updateProgress} className="h-1" />
                  <p className="text-center text-xs text-gray-400">
                    Downloading update: {Math.round(updateProgress)}%
                  </p>
                </div>
              )}

              {updateInfo.status === UpdateStatus.AVAILABLE && (
                <div className="flex justify-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => void handleUpdate()}
                    disabled={isUpdating}
                    className="text-xs"
                  >
                    {isUpdating ? "Updating..." : "Update now"}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
