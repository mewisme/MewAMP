use std::{fs, path::PathBuf};

use serde::Serialize;

use crate::{
    error::MewAmpError,
    state::{app_root_dir, load_state},
};

#[derive(Debug, Serialize)]
pub struct DiagnosticsSnapshot {
    pub app_version: String,
    pub os: String,
    pub state: serde_json::Value,
}

pub fn get_diagnostics_snapshot() -> Result<DiagnosticsSnapshot, MewAmpError> {
    let state = load_state()?;
    let os = std::env::consts::OS.to_string();
    let state_json = serde_json::to_value(state).map_err(|e| MewAmpError::State(e.to_string()))?;
    Ok(DiagnosticsSnapshot {
        app_version: env!("CARGO_PKG_VERSION").to_string(),
        os,
        state: state_json,
    })
}

pub fn export_diagnostics_bundle() -> Result<String, MewAmpError> {
    let snapshot = get_diagnostics_snapshot()?;
    let mut output_dir = app_root_dir()?;
    output_dir.push("app");
    output_dir.push("logs");
    fs::create_dir_all(&output_dir)?;

    let mut bundle_path = PathBuf::from(&output_dir);
    bundle_path.push("diagnostics.json");
    let json = serde_json::to_string_pretty(&snapshot).map_err(|e| MewAmpError::State(e.to_string()))?;
    fs::write(&bundle_path, json)?;
    Ok(bundle_path.to_string_lossy().to_string())
}
