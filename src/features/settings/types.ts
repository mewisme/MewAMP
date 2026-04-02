export type SettingsSnapshot = {
  runtime_root: string;
  data_root: string;
  config_root: string;
  selected_manifest_source: string;
  selected_manifest_version: string;
};

export type PortStatus = "idle" | "checking" | "available" | "in_use";

export type SqlLocalDbAction = "create" | "delete" | "uninstall";
