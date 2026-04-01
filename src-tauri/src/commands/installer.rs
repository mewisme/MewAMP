use crate::{
    error::ErrorPayload,
    installer::{run_install, InstallConfig},
    logs::append_log,
    state::{load_state, save_state, AppState},
};

#[tauri::command]
pub async fn start_install(
    app: tauri::AppHandle,
    config: InstallConfig,
) -> Result<(), ErrorPayload> {
    match run_install(&app, config).await {
        Ok(()) => Ok(()),
        Err(err) => {
            let _ = append_log("installer", &format!("Install failed: {err}"));
            Err(err.into())
        }
    }
}

#[tauri::command]
pub fn get_install_state() -> Result<AppState, ErrorPayload> {
    load_state().map_err(Into::into)
}

#[tauri::command]
pub fn reset_install_state() -> Result<(), ErrorPayload> {
    let state = AppState::default();
    save_state(&state).map_err(Into::into)
}
