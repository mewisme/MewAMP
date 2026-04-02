import { useNavigate } from "react-router-dom";
import { PageHeader } from "@/components/PageHeader";
import { PanelShell } from "@/components/PanelShell";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

export function DashboardNotInstalled() {
  const navigate = useNavigate();
  return (
    <PanelShell
      header={
        <PageHeader
          icon={AlertTriangle}
          title="Setup required"
          description="Install the runtime stack before using the dashboard."
        />
      }
    >
      <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
        Run Setup Wizard first to download Apache, PHP, MariaDB, and phpMyAdmin.
      </p>
      <Button type="button" onClick={() => navigate("/setup")}>
        Open Setup Wizard
      </Button>
    </PanelShell>
  );
}
