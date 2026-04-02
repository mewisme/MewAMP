import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

export function ModulesSetupFooter({
  step,
  installing,
  onBack,
  onNext,
  onInstall,
}: {
  step: number;
  installing: boolean;
  onBack: () => void;
  onNext: () => void | Promise<void>;
  onInstall: () => void | Promise<void>;
}) {
  if (step === 4) return null;

  return (
    <div className="flex flex-col-reverse gap-2 border-t border-border/50 pt-4 sm:flex-row sm:justify-between">
      <Button variant="outline" className="rounded-xl" disabled={step === 0 || installing} onClick={onBack}>
        Back
      </Button>

      <div className="flex gap-2">
        {step < 3 && (
          <Button className="rounded-xl" disabled={installing} onClick={() => void onNext()}>
            Next
          </Button>
        )}
        {step === 3 && (
          <Button className="rounded-xl" disabled={installing} onClick={() => void onInstall()}>
            {installing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Installing…
              </>
            ) : (
              "Install now"
            )}
          </Button>
        )}
      </div>
    </div>
  );
}
