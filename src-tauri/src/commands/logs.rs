use crate::{
    error::ErrorPayload,
    logs::{clear_log, read_log},
};

#[tauri::command]
pub fn get_log(kind: String) -> Result<String, ErrorPayload> {
    read_log(&kind).map_err(Into::into)
}

#[tauri::command]
pub fn clear_log_file(kind: String) -> Result<(), ErrorPayload> {
    clear_log(&kind).map_err(Into::into)
}
