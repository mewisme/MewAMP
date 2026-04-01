import { invoke } from "@tauri-apps/api/core";

export type InstallConfig = {
  runtimeRoot: string;
  dataRoot: string;
  apacheHttpPort: number;
  apacheHttpsPort: number;
  mariadbPort: number;
  installPhpmyadmin: boolean;
  forceReinstall: boolean;
};

export type InstallState = {
  app_version: string;
  install_completed: boolean;
  selected_manifest_source: string;
  selected_manifest_version: string;
  runtime_root: string;
  data_root: string;
  config_root: string;
  ports: { apache_http: number; apache_https: number; mariadb: number };
};

export type PortStatus = { port: number; available: boolean };
export type ServiceStatus = { name: string; status: string };

export const getInstallState = () => invoke<InstallState>("get_install_state");
export const startInstall = (config: InstallConfig) =>
  invoke<void>("start_install", {
    config: {
      runtime_root: config.runtimeRoot,
      data_root: config.dataRoot,
      apache_http_port: config.apacheHttpPort,
      apache_https_port: config.apacheHttpsPort,
      mariadb_port: config.mariadbPort,
      install_phpmyadmin: config.installPhpmyadmin,
      force_reinstall: config.forceReinstall,
    },
  });
export const resetInstallState = () => invoke<void>("reset_install_state");
export const checkPorts = (ports: number[]) => invoke<PortStatus[]>("check_ports", { ports });
export const getServiceStatus = (name: string) =>
  invoke<ServiceStatus>("get_service_status", { name });
export const getHtdocsPath = () => invoke<string>("get_htdocs_path");
export const openFolder = (path: string) => invoke<void>("open_folder", { path });
export const startService = (name: string, bin: string, args: string[], cwd: string) =>
  invoke<void>("start_service", { name, bin, args, cwd });
export const startManagedService = (name: "apache" | "mariadb") =>
  invoke<void>("start_managed_service", { name });
export const stopService = (name: string) => invoke<void>("stop_service", { name });
export const getDiagnostics = () => invoke<Record<string, unknown>>("get_diagnostics");
export const exportDiagnostics = () => invoke<string>("export_diagnostics");
export const getLog = (kind: "app" | "installer" | "apache" | "mariadb") =>
  invoke<string>("get_log", { kind });
export const clearLogFile = (kind: "app" | "installer" | "apache" | "mariadb") =>
  invoke<void>("clear_log_file", { kind });
