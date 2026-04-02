import { Moon, Monitor, Palette, Sun } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { SectionHeader } from "@/components/SectionHeader";
import { Skeleton } from "@/components/ui/skeleton";
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
    <Card className="rounded-xl border-border/60 shadow-none">
      <CardContent className="space-y-3 p-4">
        <SectionHeader icon={Palette} title="Appearance" description="Theme for the MewAMP UI." />

        {mounted ? (
          <div className="grid gap-2 sm:grid-cols-3">
            <ThemeOption icon={Sun} label="Light" active={theme === "light"} onClick={() => setTheme("light")} />
            <ThemeOption icon={Moon} label="Dark" active={theme === "dark"} onClick={() => setTheme("dark")} />
            <ThemeOption icon={Monitor} label="System" active={theme === "system"} onClick={() => setTheme("system")} />
          </div>
        ) : (
          <div className="grid gap-2 sm:grid-cols-3">
            <Skeleton className="h-8 rounded-lg" />
            <Skeleton className="h-8 rounded-lg" />
            <Skeleton className="h-8 rounded-lg" />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
