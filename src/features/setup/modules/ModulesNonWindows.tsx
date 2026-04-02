import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";

export function ModulesNonWindows({ onBack }: { onBack: () => void }) {
  return (
    <Card className="overflow-hidden rounded-3xl border-border/60 bg-card/80 shadow-sm backdrop-blur-sm">
      <CardHeader className="border-b border-border/50 pb-5">
        <Button type="button" variant="ghost" size="sm" className="w-fit gap-2 rounded-xl px-2" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" />
          All setup options
        </Button>
        <CardTitle className="pt-2">Modules setup</CardTitle>
        <CardDescription>No optional modules are available for this platform yet.</CardDescription>
      </CardHeader>
    </Card>
  );
}
