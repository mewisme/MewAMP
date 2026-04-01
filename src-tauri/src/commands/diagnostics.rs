use crate::{
    diagnostics::{export_diagnostics_bundle, get_diagnostics_snapshot, DiagnosticsSnapshot},
    error::ErrorPayload,
};

#[tauri::command]
pub fn get_diagnostics() -> Result<DiagnosticsSnapshot, ErrorPayload> {
    get_diagnostics_snapshot().map_err(Into::into)
}

#[tauri::command]
pub fn export_diagnostics() -> Result<String, ErrorPayload> {
    export_diagnostics_bundle().map_err(Into::into)
}
