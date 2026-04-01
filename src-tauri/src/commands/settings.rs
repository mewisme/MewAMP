use serde::{Deserialize, Serialize};
use std::path::{Path, PathBuf};
use tokio::process::Command;

use crate::{
    error::ErrorPayload,
    state::{load_state, save_state},
};

fn find_dir_recursive(root: &Path, dir_name: &str) -> Option<PathBuf> {
    if !root.exists() {
        return None;
    }
    let entries = std::fs::read_dir(root).ok()?;
    for entry in entries.flatten() {
        let path = entry.path();
        if path.is_dir() {
            if path
                .file_name()
                .and_then(|n| n.to_str())
                .map(|n| n.eq_ignore_ascii_case(dir_name))
                .unwrap_or(false)
            {
                return Some(path);
            }
            if let Some(found) = find_dir_recursive(&path, dir_name) {
                return Some(found);
            }
        }
    }
    None
}

#[derive(Debug, Deserialize)]
pub struct UpdatePortsInput {
    pub apache_http: u16,
    pub apache_https: u16,
    pub mariadb: u16,
}

#[derive(Debug, Deserialize)]
pub struct UpdatePathsInput {
    pub runtime_root: String,
    pub data_root: String,
    pub config_root: String,
}

#[derive(Debug, Serialize)]
pub struct SettingsView {
    pub runtime_root: String,
    pub data_root: String,
    pub config_root: String,
    pub selected_manifest_source: String,
    pub selected_manifest_version: String,
}

#[tauri::command]
pub fn get_app_settings() -> Result<SettingsView, ErrorPayload> {
    let state = load_state().map_err(ErrorPayload::from)?;
    Ok(SettingsView {
        runtime_root: state.runtime_root,
        data_root: state.data_root,
        config_root: state.config_root,
        selected_manifest_source: state.selected_manifest_source,
        selected_manifest_version: state.selected_manifest_version,
    })
}

#[tauri::command]
pub fn update_ports(input: UpdatePortsInput) -> Result<(), ErrorPayload> {
    let mut state = load_state().map_err(ErrorPayload::from)?;
    state.ports.apache_http = input.apache_http;
    state.ports.apache_https = input.apache_https;
    state.ports.mariadb = input.mariadb;
    save_state(&state).map_err(ErrorPayload::from)
}

#[tauri::command]
pub fn update_paths(input: UpdatePathsInput) -> Result<(), ErrorPayload> {
    let mut state = load_state().map_err(ErrorPayload::from)?;
    state.runtime_root = input.runtime_root;
    state.data_root = input.data_root;
    state.config_root = input.config_root;
    save_state(&state).map_err(ErrorPayload::from)
}

#[tauri::command]
pub fn get_htdocs_path() -> Result<String, ErrorPayload> {
    let state = load_state().map_err(ErrorPayload::from)?;
    let runtime_root = PathBuf::from(state.runtime_root);
    let apache_root = runtime_root.join("apache");

    let candidates = [
        apache_root.join("Apache24").join("htdocs"),
        apache_root.join("htdocs"),
    ];
    for candidate in candidates {
        if candidate.exists() {
            return Ok(candidate.to_string_lossy().to_string());
        }
    }

    if let Some(found) = find_dir_recursive(&apache_root, "htdocs") {
        return Ok(found.to_string_lossy().to_string());
    }

    Err(ErrorPayload {
        message: "Could not locate htdocs directory in runtime".to_string(),
    })
}

#[tauri::command]
pub async fn open_folder(path: String) -> Result<(), ErrorPayload> {
    let target = PathBuf::from(path);
    if !target.exists() {
        return Err(ErrorPayload {
            message: "Folder does not exist".to_string(),
        });
    }

    Command::new("explorer.exe")
        .arg(target.to_string_lossy().to_string())
        .spawn()
        .map_err(|e| ErrorPayload {
            message: format!("Failed to open folder: {e}"),
        })?;

    Ok(())
}
