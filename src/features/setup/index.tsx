import { useEffect, useMemo, useRef, useState } from "react";
import { useAtom } from "jotai";
import { setupConfigAtom, setupInstallingAtom, setupStepAtom } from "@/stores/setup";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { open } from "@tauri-apps/plugin-dialog";
import { clearLogFile, getLog, startInstall } from "@/lib/tauri-commands";
import { writeText } from "@tauri-apps/plugin-clipboard-manager";
import { toast } from "sonner";
import {
  CheckCircle2,
  ChevronRight,
  Database,
  FolderOpen,
  Globe,
  HardDrive,
  Loader2,
  Package,
  Rocket,
  Settings2,
  Shield,
  Wrench,
} from "lucide-react";
import { cn } from "@/lib/utils";

const steps = ["Welcome", "Paths", "Ports", "Components", "Manifest", "Install", "Complete"];

const DEFAULT_SETUP_CONFIG = {
  runtimeRoot: "",
  dataRoot: "",
  apacheHttpPort: 8080,
  apacheHttpsPort: 8443,
  mariadbPort: 3306,
  installPhpmyadmin: true,
  forceReinstall: false,
};

export function SetupWizard() {
  const [step, setStep] = useAtom(setupStepAtom);
  const [config, setConfig] = useAtom(setupConfigAtom);
  const [installing, setInstalling] = useAtom(setupInstallingAtom);
  const [installerLog, setInstallerLog] = useState("");
  const installerLogRef = useRef<HTMLPreElement | null>(null);

  useEffect(() => {
    if (step !== 5) return;

    const loadInstallerLog = async () => {
      try {
        const log = await getLog("installer");
        setInstallerLog(log);
      } catch (error) {
        console.error(error);
      }
    };

    loadInstallerLog();
    const id = setInterval(loadInstallerLog, 1500);
    return () => clearInterval(id);
  }, [step, installing]);

  useEffect(() => {
    if (step !== 5) return;
    const el = installerLogRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [installerLog, step]);

  const progressValue = useMemo(() => {
    if (steps.length <= 1) return 0;
    return (step / (steps.length - 1)) * 100;
  }, [step]);

  const onInstall = async () => {
    setInstalling(true);
    try {
      await startInstall(config);
      setStep(6);
      toast.success("Runtime installation completed.");
    } catch (error) {
      console.error(error);
      const message = error instanceof Error ? error.message : "Installation failed. Check logs and try again.";
      toast.error(message);
    } finally {
      setInstalling(false);
    }
  };

  const pickFolder = async (key: "runtimeRoot" | "dataRoot") => {
    const selected = await open({
      directory: true,
      multiple: false,
      title: key === "runtimeRoot" ? "Select Runtime Root Folder" : "Select Data Root Folder",
    });

    if (typeof selected === "string") {
      setConfig({ ...config, [key]: selected });
    }
  };

  const onNext = async () => {
    if (step === 4) {
      try {
        await clearLogFile("installer");
        setInstallerLog("");
      } catch (error) {
        console.error(error);
      }
    }
    setStep(step + 1);
  };

  const onFastSetup = async () => {
    try {
      setConfig(DEFAULT_SETUP_CONFIG);
      await clearLogFile("installer");
      setInstallerLog("");
      setStep(5);
      toast.success("Fast setup applied. Ready to install with defaults.");
    } catch (error) {
      console.error(error);
      toast.error("Failed to start fast setup.");
    }
  };

  const copyInstallerLog = async () => {
    try {
      await writeText(installerLog || "");
      toast.success("Installer log copied.");
    } catch (error) {
      console.error(error);
      toast.error("Failed to copy installer log.");
    }
  };

  return (
    <Card className="overflow-hidden rounded-3xl border-border/60 bg-card/80 shadow-sm backdrop-blur-sm">
      <CardHeader className="gap-4 border-b border-border/50 pb-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-muted">
                <Rocket className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <CardTitle className="text-2xl">MewAMP Setup Wizard</CardTitle>
                <CardDescription className="mt-1">
                  Configure runtime paths, ports, components, and install your local stack.
                </CardDescription>
              </div>
            </div>

            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>
                Step {step + 1} of {steps.length}
              </span>
              <ChevronRight className="h-4 w-4" />
              <span className="font-medium text-foreground">{steps[step]}</span>
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

        <div className="grid grid-cols-2 gap-2 md:grid-cols-4 xl:grid-cols-7">
          {steps.map((label, index) => {
            const active = step === index;
            const done = index < step;

            return (
              <div
                key={label}
                className={cn(
                  "flex items-center gap-2 rounded-xl border px-3 py-2 text-sm transition-all",
                  active && "border-primary/30 bg-primary/10 text-foreground",
                  done && "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
                  !active && !done && "border-border/60 bg-muted/30 text-muted-foreground"
                )}
              >
                <div
                  className={cn(
                    "flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold",
                    active && "bg-primary text-primary-foreground",
                    done && "bg-emerald-600 text-white",
                    !active && !done && "bg-background text-muted-foreground border"
                  )}
                >
                  {done ? <CheckCircle2 className="h-3.5 w-3.5" /> : index + 1}
                </div>
                <span className="truncate">{label}</span>
              </div>
            );
          })}
        </div>
      </CardHeader>

      <CardContent className="space-y-6 p-6">
        {step === 0 && (
          <div className="grid gap-4 lg:grid-cols-[1.15fr_.85fr]">
            <Card className="rounded-2xl border-border/60 bg-muted/20 shadow-none">
              <CardContent className="p-6">
                <div className="mb-5 flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-background border">
                    <Rocket className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">Welcome to MewAMP</h3>
                    <p className="text-sm text-muted-foreground">
                      Set up Apache, PHP, MariaDB, and optional phpMyAdmin in a few guided steps.
                    </p>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                  <FeatureTile
                    icon={Package}
                    title="Manifest-based"
                    description="Downloads selected runtime packages instead of bundling them."
                  />
                  <FeatureTile
                    icon={Settings2}
                    title="Configurable"
                    description="Choose your own paths, ports, and optional components."
                  />
                  <FeatureTile
                    icon={Shield}
                    title="Beginner-friendly"
                    description="Safe defaults and a manual flow when you need more control."
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-2xl border-border/60 shadow-none">
              <CardContent className="flex h-full flex-col justify-between p-6">
                <div className="space-y-3">
                  <Alert className="rounded-2xl">
                    <AlertTitle>Fast Setup</AlertTitle>
                    <AlertDescription>
                      Use default paths and ports, include phpMyAdmin, and jump directly to the install step.
                    </AlertDescription>
                  </Alert>
                </div>

                <div className="mt-6 grid gap-3">
                  <Button size="lg" className="h-12 rounded-xl" onClick={onFastSetup}>
                    <Rocket className="mr-2 h-4 w-4" />
                    Fast Setup
                  </Button>
                  <Button size="lg" variant="outline" className="h-12 rounded-xl" onClick={() => setStep(1)}>
                    Manual Setup
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {step === 1 && (
          <div className="grid gap-4">
            <SectionIntro
              icon={FolderOpen}
              title="Choose installation folders"
              description="Separate runtime files from your database data so the stack is easier to manage and back up."
            />

            <PathField
              label="Runtime Root"
              value={config.runtimeRoot}
              placeholder="C:\\Users\\YourName\\AppData\\Roaming\\MewAMP"
              hint="Runtime binaries and app-managed configs will be installed here."
              onChange={(value) => setConfig({ ...config, runtimeRoot: value })}
              onBrowse={() => pickFolder("runtimeRoot")}
            />

            <PathField
              label="Data Root"
              value={config.dataRoot}
              placeholder="D:\\MewAMPData"
              hint="MariaDB database files will be stored here. Choose a stable location for backup."
              onChange={(value) => setConfig({ ...config, dataRoot: value })}
              onBrowse={() => pickFolder("dataRoot")}
            />
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <SectionIntro
              icon={Globe}
              title="Configure local ports"
              description="A port is the local endpoint a service uses. If another app already uses the same port, the service cannot start."
            />

            <div className="grid gap-4 md:grid-cols-3">
              <PortField
                label="Apache HTTP Port"
                value={config.apacheHttpPort}
                example="http://localhost:8080"
                defaultValue="8080"
                onChange={(value) => setConfig({ ...config, apacheHttpPort: value })}
              />
              <PortField
                label="Apache HTTPS Port"
                value={config.apacheHttpsPort}
                example="https://localhost:8443"
                defaultValue="8443"
                onChange={(value) => setConfig({ ...config, apacheHttpsPort: value })}
              />
              <PortField
                label="MariaDB Port"
                value={config.mariadbPort}
                example="Client / backend database connections"
                defaultValue="3306"
                onChange={(value) => setConfig({ ...config, mariadbPort: value })}
              />
            </div>

            <Alert className="rounded-2xl">
              <AlertTitle>Tips for beginners</AlertTitle>
              <AlertDescription>
                Keep the defaults unless you already use another local stack like XAMPP, Docker, or IIS. If a conflict appears later,
                choose any unused port above 1024.
              </AlertDescription>
            </Alert>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <SectionIntro
              icon={Package}
              title="Select components"
              description="Required components are always installed. Optional tools can be enabled or skipped."
            />

            <div className="grid gap-4 md:grid-cols-2">
              <ComponentTile
                title="Apache"
                description="Web server runtime. Always installed from the selected manifest."
                required
                icon={Globe}
              />
              <ComponentTile
                title="PHP"
                description="PHP runtime for local development. Always installed from the selected manifest."
                required
                icon={Wrench}
              />
              <ComponentTile
                title="MariaDB"
                description="Local database runtime. Always installed from the selected manifest."
                required
                icon={Database}
              />
              <OptionalComponentTile
                title="phpMyAdmin"
                description="Browser-based database UI. Install it now or skip it for a lighter setup."
                checked={config.installPhpmyadmin}
                onCheckedChange={(checked) => setConfig({ ...config, installPhpmyadmin: checked })}
                icon={HardDrive}
              />
            </div>

            <Card className="rounded-2xl border-border/60 shadow-none">
              <CardContent className="flex items-start justify-between gap-4 p-5">
                <div className="space-y-1">
                  <div className="font-medium">Force reinstall runtimes</div>
                  <p className="text-sm text-muted-foreground">
                    Redownload and reinstall packages even if the installed versions already match the selected manifest.
                  </p>
                </div>
                <Switch
                  checked={config.forceReinstall}
                  onCheckedChange={(checked) => setConfig({ ...config, forceReinstall: checked })}
                />
              </CardContent>
            </Card>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-4">
            <SectionIntro
              icon={Package}
              title="Manifest source"
              description="MewAMP resolves runtime packages automatically using a preferred remote source with a builtin fallback."
            />

            <div className="grid gap-4 md:grid-cols-2">
              <InfoTile
                title="Remote preferred"
                description="The app first attempts to resolve the latest manifest from your configured remote source."
              />
              <InfoTile
                title="Builtin fallback"
                description="If the remote manifest is unavailable, MewAMP falls back to the builtin manifest bundled with the app."
              />
            </div>

            <Alert className="rounded-2xl">
              <AlertTitle>No manual action needed</AlertTitle>
              <AlertDescription>
                Continue to the next step and MewAMP will resolve the manifest automatically before installation starts.
              </AlertDescription>
            </Alert>
          </div>
        )}

        {step === 5 && (
          <div className="space-y-4">
            <SectionIntro
              icon={installing ? Loader2 : Wrench}
              title={installing ? "Installing runtime stack" : "Ready to install"}
              description={
                installing
                  ? "The installation pipeline is running. You can monitor progress in the live installer log below."
                  : "Review the live installer log during setup. Start when you're ready."
              }
              spinning={installing}
            />

            <Card className="rounded-2xl border-border/60 shadow-none">
              <CardContent className="space-y-4 p-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="font-medium">Installer Log</div>
                    <p className="text-sm text-muted-foreground">
                      Live output from the runtime installation pipeline.
                    </p>
                  </div>
                  <Button type="button" variant="outline" size="sm" className="rounded-xl" onClick={copyInstallerLog}>
                    Copy Log
                  </Button>
                </div>

                <div className="rounded-2xl border border-border/60 bg-muted/30 p-1">
                  <pre
                    ref={installerLogRef}
                    className="max-h-[42vh] overflow-auto whitespace-pre-wrap break-words rounded-xl bg-background/60 p-4 text-xs leading-6"
                  >
                    {installerLog || "No installer logs yet."}
                  </pre>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {step === 6 && (
          <Card className="rounded-2xl border-emerald-500/20 bg-emerald-500/5 shadow-none">
            <CardContent className="flex flex-col items-center justify-center gap-4 p-8 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10">
                <CheckCircle2 className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-semibold">Installation complete</h3>
                <p className="max-w-xl text-sm text-muted-foreground">
                  Your MewAMP runtime stack has been installed successfully. You can now start services and begin local development.
                </p>
              </div>
              <div className="flex flex-wrap justify-center gap-2">
                <Badge variant="outline" className="rounded-full px-3 py-1">
                  Apache
                </Badge>
                <Badge variant="outline" className="rounded-full px-3 py-1">
                  PHP
                </Badge>
                <Badge variant="outline" className="rounded-full px-3 py-1">
                  MariaDB
                </Badge>
                {config.installPhpmyadmin && (
                  <Badge variant="outline" className="rounded-full px-3 py-1">
                    phpMyAdmin
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {step !== 0 && step !== 6 && (
          <div className="flex flex-col-reverse gap-2 border-t border-border/50 pt-4 sm:flex-row sm:justify-between">
            <Button
              variant="outline"
              className="rounded-xl"
              disabled={step === 0 || installing}
              onClick={() => setStep(step - 1)}
            >
              Back
            </Button>

            <div className="flex gap-2">
              {step < 5 && (
                <Button className="rounded-xl" disabled={installing} onClick={onNext}>
                  Next
                </Button>
              )}
              {step === 5 && (
                <Button className="rounded-xl" disabled={installing} onClick={onInstall}>
                  {installing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Installing...
                    </>
                  ) : (
                    "Install Now"
                  )}
                </Button>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function SectionIntro({
  icon: Icon,
  title,
  description,
  spinning = false,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  spinning?: boolean;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-muted">
        <Icon className={cn("h-5 w-5 text-muted-foreground", spinning && "animate-spin")} />
      </div>
      <div className="space-y-1">
        <h3 className="text-lg font-semibold">{title}</h3>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}

function FeatureTile({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-border/60 bg-background/60 p-4">
      <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-muted">
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="font-medium">{title}</div>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
    </div>
  );
}

function PathField({
  label,
  value,
  placeholder,
  hint,
  onChange,
  onBrowse,
}: {
  label: string;
  value: string;
  placeholder: string;
  hint: string;
  onChange: (value: string) => void;
  onBrowse: () => void;
}) {
  return (
    <Card className="rounded-2xl border-border/60 shadow-none">
      <CardContent className="space-y-3 p-5">
        <Label className="text-sm font-medium">{label}</Label>
        <div className="flex gap-2">
          <Input value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
          <Button type="button" variant="outline" className="rounded-xl" onClick={onBrowse}>
            Browse
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">{hint}</p>
      </CardContent>
    </Card>
  );
}

function PortField({
  label,
  value,
  example,
  defaultValue,
  onChange,
}: {
  label: string;
  value: number;
  example: string;
  defaultValue: string;
  onChange: (value: number) => void;
}) {
  return (
    <Card className="rounded-2xl border-border/60 shadow-none">
      <CardContent className="space-y-3 p-5">
        <Label className="text-sm font-medium">{label}</Label>
        <Input type="number" value={value} onChange={(e) => onChange(Number(e.target.value))} />
        <div className="space-y-1 text-xs text-muted-foreground">
          <p>{example}</p>
          <p>
            Default: <code>{defaultValue}</code>
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

function ComponentTile({
  title,
  description,
  required,
  icon: Icon,
}: {
  title: string;
  description: string;
  required?: boolean;
  icon: React.ElementType;
}) {
  return (
    <Card className="rounded-2xl border-border/60 shadow-none">
      <CardContent className="space-y-3 p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted">
              <Icon className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <div className="font-medium">{title}</div>
              <p className="text-sm text-muted-foreground">{description}</p>
            </div>
          </div>
          {required && <Badge>Required</Badge>}
        </div>
      </CardContent>
    </Card>
  );
}

function OptionalComponentTile({
  title,
  description,
  checked,
  onCheckedChange,
  icon: Icon,
}: {
  title: string;
  description: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  icon: React.ElementType;
}) {
  return (
    <Card className="rounded-2xl border-border/60 shadow-none">
      <CardContent className="space-y-3 p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted">
              <Icon className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <div className="font-medium">{title}</div>
              <p className="text-sm text-muted-foreground">{description}</p>
            </div>
          </div>
          <Badge variant="secondary">Optional</Badge>
        </div>

        <div className="flex items-center justify-between rounded-xl border border-border/60 bg-muted/20 px-4 py-3">
          <div className="text-sm font-medium">Install {title}</div>
          <Switch checked={checked} onCheckedChange={onCheckedChange} />
        </div>
      </CardContent>
    </Card>
  );
}

function InfoTile({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <Card className="rounded-2xl border-border/60 shadow-none">
      <CardContent className="space-y-2 p-5">
        <div className="font-medium">{title}</div>
        <p className="text-sm text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}