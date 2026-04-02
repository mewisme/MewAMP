use serde::{Deserialize, Serialize};
use std::{fs, path::PathBuf};

use crate::error::MewAmpError;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Ports {
    pub apache_http: u16,
    pub apache_https: u16,
    pub mariadb: u16,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct HealthStatus {
    pub apache: Option<bool>,
    pub mariadb: Option<bool>,
    pub phpmyadmin: Option<bool>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct InstalledComponents {
    pub apache: Option<String>,
    pub php: Option<String>,
    pub mariadb: Option<String>,
    pub phpmyadmin: Option<String>,
}

fn default_sql_localdb_instance_name() -> String {
    "MewAMP".into()
}

/// Tracks SqlLocalDB installs performed by MewAMP so uninstallers can remove only app-owned MSI registrations.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SqlLocalDbInstallRecord {
    pub installed_by_app: bool,
    pub version: String,
    pub manifest_key: String,
    /// Windows Installer ProductCode including braces, e.g. `{GUID}` — required for reliable `msiexec /x`.
    pub product_code: String,
    pub install_timestamp: String,
    pub install_log_path: Option<String>,
    pub staged_msi_path: Option<String>,
    /// Named LocalDB instance created via `sqllocaldb create` after MSI install.
    #[serde(default = "default_sql_localdb_instance_name")]
    pub instance_name: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AppState {
    pub app_version: String,
    pub install_completed: bool,
    pub selected_manifest_source: String,
    pub selected_manifest_version: String,
    pub manifest_snapshot_path: Option<String>,
    pub runtime_root: String,
    pub data_root: String,
    pub config_root: String,
    #[serde(default)]
    pub installed_components: InstalledComponents,
    #[serde(default)]
    pub sql_localdb: Option<SqlLocalDbInstallRecord>,
    pub ports: Ports,
    pub health_status: HealthStatus,
    pub last_install_error: Option<String>,
}

impl Default for AppState {
    fn default() -> Self {
        Self {
            app_version: "0.1.0".into(),
            install_completed: false,
            selected_manifest_source: "builtin".into(),
            selected_manifest_version: "unknown".into(),
            manifest_snapshot_path: None,
            runtime_root: String::new(),
            data_root: String::new(),
            config_root: String::new(),
            installed_components: InstalledComponents::default(),
            sql_localdb: None,
            ports: Ports {
                apache_http: 8080,
                apache_https: 8443,
                mariadb: 3306,
            },
            health_status: HealthStatus::default(),
            last_install_error: None,
        }
    }
}

pub fn app_root_dir() -> Result<PathBuf, MewAmpError> {
    let mut dir =
        dirs::data_dir().ok_or_else(|| MewAmpError::State("missing data dir".to_string()))?;
    dir.push("MewAMP");
    Ok(dir)
}

pub fn state_dir() -> Result<PathBuf, MewAmpError> {
    let mut path = app_root_dir()?;
    path.push("app");
    path.push("state");
    fs::create_dir_all(&path)?;
    Ok(path)
}

pub fn state_file_path() -> Result<PathBuf, MewAmpError> {
    Ok(state_dir()?.join("state.json"))
}

/// JSON mirror of [`SqlLocalDbInstallRecord`] for NSIS/WiX hooks and external tooling.
pub fn sql_localdb_ownership_json_path() -> Result<PathBuf, MewAmpError> {
    Ok(state_dir()?.join("sql_localdb_ownership.json"))
}

pub fn load_state() -> Result<AppState, MewAmpError> {
    let path = state_file_path()?;
    if !path.exists() {
        return Ok(AppState::default());
    }
    let content = fs::read_to_string(path)?;
    serde_json::from_str::<AppState>(&content).map_err(|e| MewAmpError::State(e.to_string()))
}

pub fn save_state(state: &AppState) -> Result<(), MewAmpError> {
    let path = state_file_path()?;
    let content =
        serde_json::to_string_pretty(state).map_err(|e| MewAmpError::State(e.to_string()))?;
    fs::write(path, content)?;
    Ok(())
}
