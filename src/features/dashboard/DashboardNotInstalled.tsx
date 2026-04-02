import { useNavigate } from "react-router-dom";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

export function DashboardNotInstalled() {
  const navigate = useNavigate();
  return (
    <Alert>
      <AlertTitle>Setup required</AlertTitle>
      <AlertDescription className="space-y-3">
        <p>Runtime is not installed yet. Run Setup Wizard first to download Apache, PHP, MariaDB, and phpMyAdmin.</p>
        <Button onClick={() => navigate("/setup")}>Open Setup Wizard</Button>
      </AlertDescription>
    </Alert>
  );
}
