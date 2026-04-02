use crate::{
    error::ErrorPayload,
    installer::{run_install, run_sql_localdb_install_only, InstallConfig},
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
pub async fn install_sql_localdb_only(
    app: tauri::AppHandle,
    sqllocaldb_version: String,
    sql_localdb_instance_name: String,
    force_reinstall: bool,
) -> Result<(), ErrorPayload> {
    match run_sql_localdb_install_only(
        &app,
        sqllocaldb_version,
        sql_localdb_instance_name,
        force_reinstall,
    )
    .await
    {
        Ok(()) => Ok(()),
        Err(err) => {
            let _ = append_log(
                "installer",
                &format!("SqlLocalDB-only install failed: {err}"),
            );
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
    let _ = crate::installer::sql_localdb::clear_persisted_sql_localdb_artifacts();
    let state = AppState::default();
    save_state(&state).map_err(Into::into)
}
