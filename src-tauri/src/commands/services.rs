use serde::Serialize;
use std::{
    fs,
    path::{Path, PathBuf},
};
use tauri::State;

use crate::{
    error::ErrorPayload,
    logs::append_log,
    process_manager::ServiceManager,
    state::load_state,
};

#[derive(Debug, Serialize)]
pub struct ServiceStatus {
    pub name: String,
    pub status: String,
}

fn find_executable_recursive(dir: &Path, executable_name: &str) -> Option<PathBuf> {
    if !dir.exists() {
        return None;
    }
    let entries = fs::read_dir(dir).ok()?;
    for entry in entries.flatten() {
        let path = entry.path();
        if path.is_file()
            && path
                .file_name()
                .and_then(|n| n.to_str())
                .map(|n| n.eq_ignore_ascii_case(executable_name))
                .unwrap_or(false)
        {
            return Some(path);
        }
        if path.is_dir() {
            if let Some(found) = find_executable_recursive(&path, executable_name) {
                return Some(found);
            }
        }
    }
    None
}

#[tauri::command]
pub async fn start_service(
    manager: State<'_, ServiceManager>,
    name: String,
    bin: String,
    args: Vec<String>,
    cwd: String,
) -> Result<(), ErrorPayload> {
    let _ = append_log("app", &format!("start_service requested: {name}"));
    manager.start(&name, &bin, &args, &cwd).await.map_err(Into::into)
}

#[tauri::command]
pub async fn start_managed_service(
    manager: State<'_, ServiceManager>,
    name: String,
) -> Result<(), ErrorPayload> {
    let _ = append_log("app", &format!("start_managed_service requested: {name}"));
    let state = load_state().map_err(ErrorPayload::from)?;
    let runtime_root = PathBuf::from(&state.runtime_root);
    let config_root = PathBuf::from(&state.config_root);

    match name.as_str() {
        "apache" => {
            let exe = find_executable_recursive(&runtime_root.join("apache"), "httpd.exe")
                .ok_or_else(|| ErrorPayload {
                    message: "Apache executable not found".to_string(),
                })?;
            let apache_root = exe
                .parent()
                .and_then(|p| p.parent())
                .ok_or_else(|| ErrorPayload {
                    message: "Apache root path not found".to_string(),
                })?;
            let conf = config_root.join("apache").join("httpd.conf");
            manager
                .start(
                    "apache",
                    &exe.to_string_lossy(),
                    &vec![
                        "-f".to_string(),
                        conf.to_string_lossy().to_string(),
                        "-DFOREGROUND".to_string(),
                    ],
                    &apache_root.to_string_lossy(),
                )
                .await
                .map_err(Into::into)
        }
        "mariadb" => {
            let exe = find_executable_recursive(&runtime_root.join("mariadb"), "mysqld.exe")
                .ok_or_else(|| ErrorPayload {
                    message: "MariaDB executable not found".to_string(),
                })?;
            let bin = exe.parent().ok_or_else(|| ErrorPayload {
                message: "MariaDB bin path not found".to_string(),
            })?;
            let conf = config_root.join("mariadb").join("my.ini");
            manager
                .start(
                    "mariadb",
                    &exe.to_string_lossy(),
                    &vec![
                        format!("--defaults-file={}", conf.to_string_lossy()),
                        "--console".to_string(),
                    ],
                    &bin.to_string_lossy(),
                )
                .await
                .map_err(Into::into)
        }
        _ => Err(ErrorPayload {
            message: "Unsupported service".to_string(),
        }),
    }
}

#[tauri::command]
pub async fn stop_service(
    manager: State<'_, ServiceManager>,
    name: String,
) -> Result<(), ErrorPayload> {
    let _ = append_log("app", &format!("stop_service requested: {name}"));
    manager.stop(&name).await.map_err(Into::into)
}

#[tauri::command]
pub fn get_service_status(manager: State<'_, ServiceManager>, name: String) -> ServiceStatus {
    ServiceStatus {
        name: name.clone(),
        status: manager.status(&name),
    }
}
