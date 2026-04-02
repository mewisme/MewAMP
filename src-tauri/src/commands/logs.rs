use crate::{
    error::ErrorPayload,
    logs::{clear_log, logs_dir, read_log},
};

#[tauri::command]
pub fn get_logs_dir() -> Result<String, ErrorPayload> {
    logs_dir()
        .map(|p| p.to_string_lossy().into_owned())
        .map_err(Into::into)
}

#[tauri::command]
pub fn get_log(kind: String) -> Result<String, ErrorPayload> {
    read_log(&kind).map_err(Into::into)
}

#[tauri::command]
pub fn clear_log_file(kind: String) -> Result<(), ErrorPayload> {
    clear_log(&kind).map_err(Into::into)
}
