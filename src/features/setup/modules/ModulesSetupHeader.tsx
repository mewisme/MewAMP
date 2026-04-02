import { Button } from "@/components/ui/button";
import { CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { SetupStepChips } from "@/features/setup/SetupStepChips";
import { modulesSetupSteps } from "@/features/setup/constants";
import { ArrowLeft, ChevronRight, Puzzle } from "lucide-react";

export function ModulesSetupHeader({
  onBack,
  step,
  progressValue,
}: {
  onBack: () => void;
  step: number;
  progressValue: number;
}) {
  return (
    <CardHeader className="gap-4 border-b border-border/50 pb-5">
      <div className="flex flex-col gap-3">
        <Button type="button" variant="ghost" size="sm" className="w-fit gap-2 rounded-xl px-2" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" />
          All setup options
        </Button>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-muted">
                <Puzzle className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <CardTitle className="text-2xl">Modules setup</CardTitle>
                <CardDescription className="mt-1">Choose, configure, and install optional stack components.</CardDescription>
              </div>
            </div>

            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>
                Step {step + 1} of {modulesSetupSteps.length}
              </span>
              <ChevronRight className="h-4 w-4" />
              <span className="font-medium text-foreground">{modulesSetupSteps[step]}</span>
            </div>
          </div>

          <div className="w-full max-w-sm space-y-2">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Overall progress</span>
              <span>{Math.round(progressValue)}%</span>
            </div>
            <Progress value={progressValue} className="h-2" />
          </div>
        </div>
      </div>

      <SetupStepChips
        labels={modulesSetupSteps}
        step={step}
        columnsClassName="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-5"
      />
    </CardHeader>
  );
}
