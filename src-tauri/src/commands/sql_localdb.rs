use crate::{
    error::ErrorPayload,
    installer::sql_localdb,
    logs::append_log,
    manifest::resolver::resolve_manifest,
    manifest::schema::SqlLocalDbManifestPackage,
};

#[tauri::command]
pub async fn get_sql_localdb_manifest_entries() -> Result<Vec<SqlLocalDbManifestPackage>, ErrorPayload> {
    let resolved = resolve_manifest().await.map_err(ErrorPayload::from)?;
    let platform = resolved
        .manifest
        .packages
        .get("windows-x64")
        .ok_or_else(|| ErrorPayload {
            message: "manifest is missing the windows-x64 package group".into(),
        })?;
    Ok(platform.sql_localdb_entries())
}

#[tauri::command]
pub fn sql_localdb_installer_supported() -> bool {
    cfg!(target_os = "windows")
}

#[tauri::command]
pub async fn uninstall_app_managed_sql_localdb() -> Result<(), ErrorPayload> {
    if !cfg!(target_os = "windows") {
        return Ok(());
    }
    sql_localdb::uninstall_app_managed_sql_localdb()
        .await
        .map_err(Into::into)
}

#[tauri::command]
pub async fn sql_localdb_cli(command: String, instance: String) -> Result<String, ErrorPayload> {
    if !cfg!(target_os = "windows") {
        return Err(ErrorPayload {
            message: "SqlLocalDB CLI is only available on Windows.".into(),
        });
    }
    let sub = match command.to_lowercase().as_str() {
        "create" => "create",
        "start" => "start",
        "stop" => "stop",
        "delete" => "delete",
        "info" => "info",
        _ => {
            return Err(ErrorPayload {
                message: format!(
                    "Unsupported sqllocaldb command '{command}'. Use create, start, stop, delete, or info."
                ),
            });
        }
    };
    let inst = instance.trim();
    if let Err(e) = sql_localdb::validate_sql_localdb_instance_name(inst) {
        let msg = e.to_string();
        let _ = append_log(
            "sqllocaldb",
            &format!("sqllocaldb {sub} {inst} -> validation error: {msg}"),
        );
        return Err(ErrorPayload { message: msg });
    }
    match sql_localdb::run_sqllocaldb_cli(sub, inst).await {
        Ok((code, text)) => {
            let body = if text.is_empty() {
                "(no output)".to_string()
            } else {
                text
            };
            let _ = append_log(
                "sqllocaldb",
                &format!(
                    "sqllocaldb {sub} {inst}\nexit_code={code:?}\n{body}",
                ),
            );
            Ok(format!("exit_code={code:?}\n{body}"))
        }
        Err(e) => {
            let msg = e.to_string();
            let _ = append_log(
                "sqllocaldb",
                &format!("sqllocaldb {sub} {inst} -> failed to run: {msg}"),
            );
            Err(ErrorPayload { message: msg })
        }
    }
}

#[tauri::command]
pub async fn list_sql_localdb_instances() -> Result<Vec<String>, ErrorPayload> {
    if !cfg!(target_os = "windows") {
        return Ok(vec![]);
    }
    sql_localdb::list_sql_localdb_instance_names()
        .await
        .map_err(Into::into)
}

#[tauri::command]
pub async fn get_sql_localdb_instance_status(instance: String) -> Result<String, ErrorPayload> {
    if !cfg!(target_os = "windows") {
        return Ok("unknown".into());
    }
    Ok(sql_localdb::sql_localdb_instance_status(instance.as_str()).await)
}

#[tauri::command]
pub async fn sql_localdb_init_runtime() -> Result<bool, ErrorPayload> {
    if !cfg!(target_os = "windows") {
        return Ok(false);
    }
    if !sql_localdb::sql_localdb_runtime_is_available().await {
        return Ok(false);
    }
    if let Err(e) = sql_localdb::ensure_default_mewamp_instance().await {
        let _ = append_log(
            "sqllocaldb",
            &format!("auto: ensure default instance (non-fatal): {e}"),
        );
    }
    Ok(true)
}
