import { Moon, Monitor, Palette, Sun } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { ThemeOption } from "@/features/settings/ThemeOption";

export function AppearanceCard({
  mounted,
  theme,
  setTheme,
}: {
  mounted: boolean;
  theme: string | undefined;
  setTheme: (theme: string) => void;
}) {
  return (
    <Card className="rounded-2xl border-border/60 shadow-none">
      <CardContent className="space-y-4 p-5">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-muted">
            <Palette className="h-4 w-4 text-muted-foreground" />
          </div>

          <div className="min-w-0 flex-1">
            <div className="font-medium">Appearance</div>
            <p className="text-sm text-muted-foreground">Choose how MewAMP looks across the app.</p>
          </div>
        </div>

        {mounted ? (
          <div className="grid gap-2 sm:grid-cols-3">
            <ThemeOption icon={Sun} label="Light" active={theme === "light"} onClick={() => setTheme("light")} />
            <ThemeOption icon={Moon} label="Dark" active={theme === "dark"} onClick={() => setTheme("dark")} />
            <ThemeOption icon={Monitor} label="System" active={theme === "system"} onClick={() => setTheme("system")} />
          </div>
        ) : (
          <div className="grid gap-2 sm:grid-cols-3">
            <div className="h-11 rounded-xl border border-border/60 bg-muted/20" />
            <div className="h-11 rounded-xl border border-border/60 bg-muted/20" />
            <div className="h-11 rounded-xl border border-border/60 bg-muted/20" />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
