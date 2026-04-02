import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { SectionIntro } from "@/features/setup/SectionIntro";
import type { SetupModuleDefinition, SetupModuleId } from "@/features/setup/modules/registry";
import { LayoutList } from "lucide-react";

export function ModulesSelectStep({
  availableModules,
  selectedIds,
  toggleModule,
}: {
  availableModules: SetupModuleDefinition[];
  selectedIds: SetupModuleId[];
  toggleModule: (id: SetupModuleId) => void;
}) {
  return (
    <div className="space-y-4">
      <SectionIntro
        icon={LayoutList}
        title="Choose modules"
        description="Select one or more optional components to install. You will configure each selected module on the next step."
      />

      <div className="grid gap-3 md:grid-cols-2">
        {availableModules.map((m) => {
          const Icon = m.icon;
          const on = selectedIds.includes(m.id);
          return (
            <Card
              key={m.id}
              className={
                on
                  ? "rounded-2xl border-primary/25 bg-primary/5 shadow-none"
                  : "rounded-2xl border-border/60 shadow-none"
              }
            >
              <CardContent className="flex items-start gap-4 p-5">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-muted">
                  <Icon className="h-5 w-5 text-muted-foreground" />
                </div>
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="font-medium">{m.title}</div>
                  <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">{m.shortDescription}</p>
                  <p className="line-clamp-2 text-xs leading-snug text-muted-foreground">{m.selectionDetail}</p>
                </div>
                <Switch
                  checked={on}
                  onCheckedChange={() => toggleModule(m.id)}
                  className="shrink-0"
                  aria-label={`Install ${m.title}`}
                />
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
