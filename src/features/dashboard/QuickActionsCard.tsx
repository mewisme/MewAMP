import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ChevronDown, Database, FolderOpen, Globe, HardDrive, ScrollText, Settings2 } from "lucide-react";

export function QuickActionsCard({
  onOpenLocalhost,
  onOpenPhpMyAdmin,
  onOpenHtdocs,
  onOpenRuntime,
  onOpenConfig,
  onOpenLogFolder,
}: {
  onOpenLocalhost: () => void;
  onOpenPhpMyAdmin: () => void;
  onOpenHtdocs: () => void;
  onOpenRuntime: () => void;
  onOpenConfig: () => void;
  onOpenLogFolder: () => void;
}) {
  return (
    <Card className="rounded-xl border-border/60 bg-card/80 shadow-sm backdrop-blur-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Quick actions</CardTitle>
        <CardDescription className="text-xs">Browser shortcuts and install folders.</CardDescription>
      </CardHeader>

      <CardContent className="flex flex-wrap items-center gap-2 pt-0">
        <Button type="button" size="sm" onClick={onOpenLocalhost} className="gap-1.5">
          <Globe className="size-3.5" />
          Localhost
        </Button>
        <Button type="button" size="sm" variant="outline" onClick={onOpenPhpMyAdmin} className="gap-1.5">
          <Database className="size-3.5" />
          phpMyAdmin
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger
            type="button"
            className={cn(buttonVariants({ variant: "outline", size: "sm" }), "gap-1")}
          >
            <FolderOpen className="size-3.5" />
            Folders
            <ChevronDown className="size-3 opacity-70" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-52">
            <DropdownMenuItem onClick={onOpenHtdocs}>
              <FolderOpen className="size-4" />
              htdocs
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onOpenRuntime}>
              <HardDrive className="size-4" />
              Runtime
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onOpenConfig}>
              <Settings2 className="size-4" />
              Config
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onOpenLogFolder}>
              <ScrollText className="size-4" />
              Log folder
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardContent>
    </Card>
  );
}
