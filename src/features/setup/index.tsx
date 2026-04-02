import { useAtom } from "jotai";
import {
  modulesSetupStepAtom,
  selectedSetupModuleIdsAtom,
  setupFlowAtom,
  setupStepAtom,
} from "@/stores/setup";
import { SetupLanding } from "@/features/setup/SetupLanding";
import { CoreSetupWizard } from "@/features/setup/core/CoreSetupWizard";
import { ModulesSetupWizard } from "@/features/setup/modules/ModulesSetupWizard";

export function SetupWizard() {
  const [flow, setFlowValue] = useAtom(setupFlowAtom);
  const [, setCoreStep] = useAtom(setupStepAtom);
  const [, setModulesStep] = useAtom(modulesSetupStepAtom);
  const [, setSelectedModules] = useAtom(selectedSetupModuleIdsAtom);

  if (flow === "landing") {
    return (
      <SetupLanding
        onPickCore={() => {
          setCoreStep(0);
          setFlowValue("core");
        }}
        onPickModules={() => {
          setModulesStep(0);
          setSelectedModules([]);
          setFlowValue("modules");
        }}
      />
    );
  }

  if (flow === "core") {
    return <CoreSetupWizard onBack={() => setFlowValue("landing")} />;
  }

  return <ModulesSetupWizard onBack={() => setFlowValue("landing")} />;
}
