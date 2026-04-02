import { useEffect, useMemo, useRef, useState } from "react";
import { useAtom } from "jotai";
import { open } from "@tauri-apps/plugin-dialog";
import { writeText } from "@tauri-apps/plugin-clipboard-manager";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import {
  modulesSetupStepAtom,
  selectedSetupModuleIdsAtom,
  setupConfigAtom,
  setupFlowAtom,
  setupInstallingAtom,
  setupStepAtom,
} from "@/stores/setup";
import { clearLogFile, getLog, startInstall } from "@/lib/tauri-commands";
import { refreshSqlLocaldbGlobalState } from "@/stores/sql-localdb";
import { coreSteps, DEFAULT_CORE_SETUP, toInstallPayload } from "@/features/setup/constants";
import { CoreSetupHeader } from "@/features/setup/core/CoreSetupHeader";
import { CoreSetupFooter } from "@/features/setup/core/CoreSetupFooter";
import { CoreWelcomeStep } from "@/features/setup/core/CoreWelcomeStep";
import { CorePathsStep } from "@/features/setup/core/CorePathsStep";
import { CorePortsStep } from "@/features/setup/core/CorePortsStep";
import { CoreComponentsStep } from "@/features/setup/core/CoreComponentsStep";
import { CoreManifestStep } from "@/features/setup/core/CoreManifestStep";
import { CoreInstallStep } from "@/features/setup/core/CoreInstallStep";
import { CoreCompleteStep } from "@/features/setup/core/CoreCompleteStep";

export function CoreSetupWizard({ onBack }: { onBack: () => void }) {
  const [, setFlow] = useAtom(setupFlowAtom);
  const [, setModulesStep] = useAtom(modulesSetupStepAtom);
  const [, setSelectedModules] = useAtom(selectedSetupModuleIdsAtom);
  const [step, setStep] = useAtom(setupStepAtom);
  const [config, setConfig] = useAtom(setupConfigAtom);
  const [installing, setInstalling] = useAtom(setupInstallingAtom);
  const [installerLog, setInstallerLog] = useState("");
  const installerLogRef = useRef<HTMLPreElement | null>(null);

  useEffect(() => {
    if (step !== 5) return;

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
    if (step !== 5) return;
    const el = installerLogRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [installerLog, step]);

  const progressValue = useMemo(() => {
    if (coreSteps.length <= 1) return 0;
    return (step / (coreSteps.length - 1)) * 100;
  }, [step]);

  const onInstall = async () => {
    setInstalling(true);
    try {
      await startInstall(toInstallPayload(config));
      void refreshSqlLocaldbGlobalState();
      setStep(6);
      toast.success("Runtime installation completed.");
    } catch (error) {
      console.error(error);
      const message = error instanceof Error ? error.message : "Installation failed. Check logs and try again.";
      toast.error(message);
    } finally {
      setInstalling(false);
    }
  };

  const pickFolder = async (key: "runtimeRoot" | "dataRoot") => {
    const selected = await open({
      directory: true,
      multiple: false,
      title: key === "runtimeRoot" ? "Select Runtime Root Folder" : "Select Data Root Folder",
    });

    if (typeof selected === "string") {
      setConfig({ ...config, [key]: selected });
    }
  };

  const onNext = async () => {
    if (step === 4) {
      try {
        await clearLogFile("installer");
        setInstallerLog("");
      } catch (error) {
        console.error(error);
      }
    }
    setStep(step + 1);
  };

  const onFastSetup = async () => {
    try {
      setConfig(DEFAULT_CORE_SETUP);
      await clearLogFile("installer");
      setInstallerLog("");
      setStep(5);
      toast.success("Fast setup applied. Ready to install with defaults.");
    } catch (error) {
      console.error(error);
      toast.error("Failed to start fast setup.");
    }
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

  const openModules = () => {
    setModulesStep(0);
    setSelectedModules(["sqllocaldb"]);
    setFlow("modules");
  };

  return (
    <Card className="overflow-hidden rounded-3xl border-border/60 bg-card/80 shadow-sm backdrop-blur-sm">
      <CoreSetupHeader onBack={onBack} step={step} progressValue={progressValue} />

      <CardContent className="space-y-6 p-6">
        {step === 0 && (
          <CoreWelcomeStep onFastSetup={() => void onFastSetup()} onManualSetup={() => setStep(1)} />
        )}
        {step === 1 && (
          <CorePathsStep
            config={config}
            setConfig={setConfig}
            onBrowseRuntime={() => void pickFolder("runtimeRoot")}
            onBrowseData={() => void pickFolder("dataRoot")}
          />
        )}
        {step === 2 && <CorePortsStep config={config} setConfig={setConfig} />}
        {step === 3 && <CoreComponentsStep config={config} setConfig={setConfig} onOpenModules={openModules} />}
        {step === 4 && <CoreManifestStep />}
        {step === 5 && (
          <CoreInstallStep
            installing={installing}
            installerLog={installerLog}
            installerLogRef={installerLogRef}
            onCopyLog={() => void copyInstallerLog()}
          />
        )}
        {step === 6 && <CoreCompleteStep installPhpmyadmin={config.installPhpmyadmin} />}

        <CoreSetupFooter
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
