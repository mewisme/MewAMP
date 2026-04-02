import { useEffect, useMemo, useRef, useState } from "react";
import { useAtom } from "jotai";
import { platform } from "@tauri-apps/plugin-os";
import { writeText } from "@tauri-apps/plugin-clipboard-manager";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import {
  modulesSetupStepAtom,
  selectedSetupModuleIdsAtom,
  sqlLocaldbModuleConfigAtom,
  setupInstallingAtom,
} from "@/stores/setup";
import { messageFromTauriInvoke } from "@/lib/invoke-error";
import {
  clearLogFile,
  getLog,
  getSqlLocalDbManifestEntries,
  installSqlLocaldbOnly,
  sqlLocaldbInstallerSupported,
  type SqlLocalDbManifestEntry,
} from "@/lib/tauri-commands";
import { refreshSqlLocaldbGlobalState } from "@/stores/sql-localdb";
import { SQL_LOCALDB_INSTANCE_PATTERN, modulesSetupSteps } from "@/features/setup/constants";
import { getSetupModulesForPlatform, orderedSelectedModules } from "@/features/setup/modules/registry";
import { ModulesSetupHeader } from "@/features/setup/modules/ModulesSetupHeader";
import { ModulesSetupFooter } from "@/features/setup/modules/ModulesSetupFooter";
import { ModulesNonWindows } from "@/features/setup/modules/ModulesNonWindows";
import { ModulesWelcomeStep } from "@/features/setup/modules/ModulesWelcomeStep";
import { ModulesSelectStep } from "@/features/setup/modules/ModulesSelectStep";
import { ModulesConfigStep } from "@/features/setup/modules/ModulesConfigStep";
import { ModulesInstallStep } from "@/features/setup/modules/ModulesInstallStep";
import { ModulesCompleteStep } from "@/features/setup/modules/ModulesCompleteStep";

export function ModulesSetupWizard({ onBack }: { onBack: () => void }) {
  const [step, setStep] = useAtom(modulesSetupStepAtom);
  const [selectedIds, setSelectedIds] = useAtom(selectedSetupModuleIdsAtom);
  const [modConfig, setModConfig] = useAtom(sqlLocaldbModuleConfigAtom);
  const [installing, setInstalling] = useAtom(setupInstallingAtom);
  const [installerLog, setInstallerLog] = useState("");
  const installerLogRef = useRef<HTMLPreElement | null>(null);
  const [sqlLocaldbEntries, setSqlLocaldbEntries] = useState<SqlLocalDbManifestEntry[]>([]);
  const [sqlLocaldbManifestError, setSqlLocaldbManifestError] = useState<string | null>(null);
  const [sqlLocaldbEntriesLoading, setSqlLocaldbEntriesLoading] = useState(false);

  const osName = platform();
  const availableModules = useMemo(() => getSetupModulesForPlatform(osName), [osName]);
  useEffect(() => {
    setSelectedIds((prev) => {
      const next = prev.filter((id) => availableModules.some((m) => m.id === id));
      if (next.length === prev.length && next.every((id, i) => id === prev[i])) return prev;
      return next;
    });
  }, [availableModules, setSelectedIds]);

  const loadSqlManifest = selectedIds.includes("sqllocaldb") && osName === "windows";

  useEffect(() => {
    if (step !== 2 || !loadSqlManifest) return;

    let cancelled = false;

    const load = async () => {
      const backendOk = await sqlLocaldbInstallerSupported().catch(() => false);
      if (!backendOk || cancelled) return;

      setSqlLocaldbEntriesLoading(true);
      setSqlLocaldbManifestError(null);
      try {
        const entries = await getSqlLocalDbManifestEntries();
        if (cancelled) return;
        if (entries.length === 0) {
          setSqlLocaldbManifestError("The manifest does not list any SqlLocalDB packages for Windows.");
          setSqlLocaldbEntries([]);
          return;
        }
        setSqlLocaldbEntries(entries);
        setModConfig((c) => {
          const years = new Set(entries.map((e) => e.releaseYear));
          const nextVersion = years.has(c.sqlLocaldbVersion)
            ? c.sqlLocaldbVersion
            : entries[0].releaseYear;
          return { ...c, sqlLocaldbVersion: nextVersion };
        });
      } catch (error) {
        console.error(error);
        if (!cancelled) {
          const message =
            error instanceof Error
              ? error.message
              : "Could not load SqlLocalDB versions from the manifest. Check your network and try again.";
          setSqlLocaldbManifestError(message);
          setSqlLocaldbEntries([]);
        }
      } finally {
        if (!cancelled) setSqlLocaldbEntriesLoading(false);
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [step, loadSqlManifest, setModConfig]);

  useEffect(() => {
    if (step !== 3) return;

    const loadInstallerLog = async () => {
      try {
        const log = await getLog("installer");
        setInstallerLog(log);
      } catch (error) {
        console.error(error);
      }
    };

    loadInstallerLog();
    const id = setInterval(loadInstallerLog, 1500);
    return () => clearInterval(id);
  }, [step, installing]);

  useEffect(() => {
    if (step !== 3) return;
    const el = installerLogRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [installerLog, step]);

  const progressValue = useMemo(() => {
    if (modulesSetupSteps.length <= 1) return 0;
    return (step / (modulesSetupSteps.length - 1)) * 100;
  }, [step]);

  const validateConfig = (): boolean => {
    const order = orderedSelectedModules(selectedIds);
    for (const id of order) {
      if (id === "sqllocaldb") {
        if (sqlLocaldbManifestError) {
          toast.error("Fix SqlLocalDB manifest errors before continuing.");
          return false;
        }
        if (!sqlLocaldbEntriesLoading && sqlLocaldbEntries.length === 0) {
          toast.error("SqlLocalDB versions could not be loaded from the manifest.");
          return false;
        }
        const inst = modConfig.sqlLocaldbInstanceName.trim();
        if (!inst || !SQL_LOCALDB_INSTANCE_PATTERN.test(inst)) {
          toast.error(
            "SqlLocalDB instance name must be non-empty and use only letters, numbers, and underscores.",
          );
          return false;
        }
      }
    }
    return true;
  };

  const onInstall = async () => {
    const order = orderedSelectedModules(selectedIds);
    if (order.length === 0) {
      toast.error("No modules selected.");
      return;
    }

    setInstalling(true);
    try {
      for (const id of order) {
        if (id === "sqllocaldb") {
          if (osName !== "windows") {
            toast.error("SqlLocalDB install is only available on Windows.");
            return;
          }
          const inst = modConfig.sqlLocaldbInstanceName.trim();
          const supported = await sqlLocaldbInstallerSupported().catch(() => false);
          if (!supported) {
            toast.error("SqlLocalDB installer is not available in this build.");
            return;
          }
          await installSqlLocaldbOnly({
            sqlLocaldbVersion: modConfig.sqlLocaldbVersion,
            sqlLocaldbInstanceName: inst,
            forceReinstall: modConfig.forceReinstall,
          });
        }
      }
      setStep(4);
      void refreshSqlLocaldbGlobalState();
      toast.success("Module installation completed.");
    } catch (error) {
      console.error(error);
      toast.error(
        messageFromTauriInvoke(error, "Installation failed. Check the Installer log (Logs panel) and try again."),
      );
    } finally {
      setInstalling(false);
    }
  };

  const onNext = async () => {
    if (step === 1) {
      if (selectedIds.length === 0) {
        toast.error("Select at least one module to continue.");
        return;
      }
    }
    if (step === 2) {
      if (!validateConfig()) return;
      try {
        await clearLogFile("installer");
        setInstallerLog("");
      } catch (error) {
        console.error(error);
      }
    }
    setStep(step + 1);
  };

  const copyInstallerLog = async () => {
    try {
      await writeText(installerLog || "");
      toast.success("Installer log copied.");
    } catch (error) {
      console.error(error);
      toast.error("Failed to copy installer log.");
    }
  };

  if (availableModules.length === 0) {
    return <ModulesNonWindows onBack={onBack} />;
  }

  return (
    <Card className="overflow-hidden rounded-xl border-border/60 bg-card/80 shadow-sm backdrop-blur-sm">
      <ModulesSetupHeader onBack={onBack} step={step} progressValue={progressValue} />

      <CardContent className="space-y-6 px-4">
        {step === 0 && <ModulesWelcomeStep />}
        {step === 1 && (
          <ModulesSelectStep
            availableModules={availableModules}
            selectedIds={selectedIds}
            toggleModule={(id) => setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))}
          />
        )}
        {step === 2 && (
          <ModulesConfigStep
            selectedIds={orderedSelectedModules(selectedIds)}
            modConfig={modConfig}
            setModConfig={setModConfig}
            sqlLocaldbEntries={sqlLocaldbEntries}
            sqlLocaldbEntriesLoading={sqlLocaldbEntriesLoading}
            sqlLocaldbManifestError={sqlLocaldbManifestError}
          />
        )}
        {step === 3 && (
          <ModulesInstallStep
            installing={installing}
            installerLog={installerLog}
            installerLogRef={installerLogRef}
            onCopyLog={() => void copyInstallerLog()}
          />
        )}
        {step === 4 && (
          <ModulesCompleteStep installedIds={orderedSelectedModules(selectedIds)} sqlConfig={modConfig} />
        )}

        <ModulesSetupFooter
          step={step}
          installing={installing}
          onBack={() => setStep(step - 1)}
          onNext={onNext}
          onInstall={onInstall}
        />
      </CardContent>
    </Card>
  );
}
