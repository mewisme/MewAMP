//! Optional Microsoft SQL Server Express LocalDB (MSI) integration.
//!
//! **Windows only** — callers should still guard with `cfg!(windows)` for UX; this module no-ops elsewhere.
//!
//! ## Uninstall strategy
//! Silent uninstall uses **`msiexec /x {ProductCode}`**, not the MSI path. A cached MSI path can move or be
//! removed; **`/x` against an `.msi` file is unreliable** once Windows Installer has registered the product.
//! We read `ProductCode` from the MSI database **before** install (Windows Installer COM via PowerShell) and
//! persist it for later removal and for generated NSIS/WiX hook helpers.

use std::{
    io::{Read, Seek, SeekFrom},
    path::{Path, PathBuf},
    sync::{
        atomic::{AtomicBool, Ordering},
        Arc,
    },
};

use chrono::Utc;
use serde::{Deserialize, Serialize};
use tokio::process::Command;

use crate::{
    checksum::verify_sha256,
    downloader::download_with_progress,
    error::MewAmpError,
    logs::append_log,
    manifest::schema::{PlatformPackages, SqlLocalDbManifestPackage},
    state::{
        load_state, save_state, sql_localdb_ownership_json_path, state_dir,
        SqlLocalDbInstallRecord,
    },
};

use super::InstallConfig;

const UNINSTALL_CMD_NAME: &str = "sqllocaldb_uninstall.cmd";

/// Friendly label for installer log lines.
const LOG_SCOPE: &str = "SqlLocalDB";

pub fn default_sqllocaldb_version() -> String {
    "2022".into()
}

pub fn default_sql_localdb_instance_name() -> String {
    "MewAMP".into()
}

/// LocalDB instance names: ASCII alphanumeric + underscore only (safe for CLI / generated uninstall scripts).
pub fn validate_sql_localdb_instance_name(name: &str) -> Result<(), MewAmpError> {
    let name = name.trim();
    if name.is_empty() {
        return Err(MewAmpError::Installer(format!(
            "{LOG_SCOPE}: instance name must not be empty"
        )));
    }
    if name.len() > 128 {
        return Err(MewAmpError::Installer(format!(
            "{LOG_SCOPE}: instance name must be at most 128 characters"
        )));
    }
    if !name
        .chars()
        .all(|c| c.is_ascii_alphanumeric() || c == '_')
    {
        return Err(MewAmpError::Installer(format!(
            "{LOG_SCOPE}: instance name may contain only letters, digits, and underscores"
        )));
    }
    Ok(())
}

/// Run `sqllocaldb.exe <subcommand> <instance>` (Windows). Used by the installer and dashboard command.
pub async fn run_sqllocaldb_cli(subcommand: &str, instance: &str) -> Result<(Option<i32>, String), MewAmpError> {
    if !cfg!(target_os = "windows") {
        return Err(MewAmpError::Installer(
            "{LOG_SCOPE}: sqllocaldb CLI is only available on Windows".into(),
        ));
    }
    validate_sql_localdb_instance_name(instance)?;
    let output = Command::new("sqllocaldb.exe")
        .arg(subcommand)
        .arg(instance)
        .output()
        .await
        .map_err(|e| {
            MewAmpError::Installer(format!(
                "{LOG_SCOPE}: failed to execute sqllocaldb.exe {subcommand}: {e}"
            ))
        })?;
    let code = output.status.code();
    let stdout = String::from_utf8_lossy(&output.stdout);
    let stderr = String::from_utf8_lossy(&output.stderr);
    let text = format!("{stdout}{stderr}").trim().to_string();
    Ok((code, text))
}

/// Parses the `State:` line from `sqllocaldb info <instance>` output (English LocalDB).
fn parse_sqllocaldb_info_state(text: &str) -> &'static str {
    for line in text.lines() {
        let trimmed = line.trim();
        let Some(colon_idx) = trimmed.find(':') else {
            continue;
        };
        let (key, rest) = trimmed.split_at(colon_idx);
        if !key.trim().eq_ignore_ascii_case("state") {
            continue;
        }
        let v = rest[1..].trim().to_lowercase();
        return match v.as_str() {
            "running" => "running",
            "stopped" => "stopped",
            "starting" => "starting",
            "stopping" => "stopping",
            _ => "unknown",
        };
    }
    "unknown"
}

/// Runtime state from `sqllocaldb info <instance>`. Does not append to log files (safe for polling).
pub async fn sql_localdb_instance_status(instance: &str) -> String {
    if !cfg!(target_os = "windows") {
        return "unknown".to_string();
    }
    let inst = instance.trim();
    if inst.is_empty() {
        return "unknown".to_string();
    }
    if validate_sql_localdb_instance_name(inst).is_err() {
        return "unknown".to_string();
    }
    match run_sqllocaldb_cli("info", inst).await {
        Ok((code, text)) => {
            if code.is_some_and(|c| c != 0) {
                return "unknown".to_string();
            }
            parse_sqllocaldb_info_state(&text).to_string()
        }
        Err(_) => "unknown".to_string(),
    }
}

/// Lists named instances reported by `sqllocaldb info` (no instance argument).
#[cfg(windows)]
pub async fn list_sql_localdb_instance_names() -> Result<Vec<String>, MewAmpError> {
    let output = Command::new("sqllocaldb.exe")
        .arg("info")
        .output()
        .await
        .map_err(|e| {
            MewAmpError::Installer(format!(
                "{LOG_SCOPE}: could not run 'sqllocaldb info' (is SqlLocalDB installed?): {e}"
            ))
        })?;
    let stdout = String::from_utf8_lossy(&output.stdout);
    let stderr = String::from_utf8_lossy(&output.stderr);
    if !output.status.success() {
        return Err(MewAmpError::Installer(format!(
            "{LOG_SCOPE}: 'sqllocaldb info' failed (exit {:?}): {}{}",
            output.status.code(),
            stdout.trim(),
            stderr.trim()
        )));
    }
    let mut names: Vec<String> = stdout
        .lines()
        .map(|l| l.trim().to_string())
        .filter(|l| !l.is_empty())
        .collect();
    names.sort();
    names.dedup();
    Ok(names)
}

#[cfg(not(windows))]
pub async fn list_sql_localdb_instance_names() -> Result<Vec<String>, MewAmpError> {
    Ok(vec![])
}

/// `true` when `sqllocaldb info` succeeds (LocalDB runtime installed and on `PATH`).
pub async fn sql_localdb_runtime_is_available() -> bool {
    if !cfg!(target_os = "windows") {
        return false;
    }
    list_sql_localdb_instance_names().await.is_ok()
}

/// Creates the default instance [`default_sql_localdb_instance_name`] if no instance matches (case-insensitive).
/// Logs to `sqllocaldb.log`; used on app init so `MewAMP` exists when LocalDB is present.
pub async fn ensure_default_mewamp_instance() -> Result<(), MewAmpError> {
    if !cfg!(target_os = "windows") {
        return Ok(());
    }
    let default_name = default_sql_localdb_instance_name();
    let instances = list_sql_localdb_instance_names().await?;
    if instances
        .iter()
        .any(|n| n.eq_ignore_ascii_case(default_name.as_str()))
    {
        return Ok(());
    }
    let (code, text) = run_sqllocaldb_cli("create", &default_name).await?;
    let body = if text.is_empty() {
        "(no output)".to_string()
    } else {
        text.clone()
    };
    let _ = append_log(
        "sqllocaldb",
        &format!(
            "auto: create default instance {default_name}\nexit_code={code:?}\n{body}",
        ),
    );
    match code {
        Some(0) => Ok(()),
        Some(_) => {
            let lower = text.to_lowercase();
            if lower.contains("already exists") || lower.contains("already been created") {
                Ok(())
            } else {
                Err(MewAmpError::Installer(format!(
                    "{LOG_SCOPE}: auto-create default instance failed: {text}"
                )))
            }
        }
        None => Err(MewAmpError::Installer(
            "{LOG_SCOPE}: auto-create default instance exited without status".into(),
        )),
    }
}

async fn best_effort_sqllocaldb_teardown(instance: &str) {
    if instance.trim().is_empty() {
        return;
    }
    if validate_sql_localdb_instance_name(instance).is_err() {
        return;
    }
    for (sub, label) in [("stop", "stop"), ("delete", "delete")] {
        match run_sqllocaldb_cli(sub, instance.trim()).await {
            Ok((code, out)) => {
                let _ = append_log(
                    "installer",
                    &format!("{LOG_SCOPE}: sqllocaldb {label} '{instance}' exit={code:?} {out}"),
                );
            }
            Err(e) => {
                let _ = append_log(
                    "installer",
                    &format!("{LOG_SCOPE}: sqllocaldb {label} '{instance}' (best-effort): {e}"),
                );
            }
        }
    }
}

async fn sqllocaldb_create_after_msi(instance: &str) -> Result<(), MewAmpError> {
    let _ = append_log(
        "installer",
        &format!("{LOG_SCOPE}: creating LocalDB instance '{instance}' (sqllocaldb create)"),
    );
    let (code, text) = run_sqllocaldb_cli("create", instance).await?;
    let _ = append_log("installer", &format!("{LOG_SCOPE}: sqllocaldb create output: {text}"));
    match code {
        Some(0) => Ok(()),
        Some(c) => Err(MewAmpError::Installer(format!(
            "{LOG_SCOPE}: sqllocaldb create failed with exit code {c}: {text}"
        ))),
        None => Err(MewAmpError::Installer(format!(
            "{LOG_SCOPE}: sqllocaldb create exited without status: {text}"
        ))),
    }
}

fn find_sql_localdb_package(
    platform: &PlatformPackages,
    version: &str,
) -> Result<SqlLocalDbManifestPackage, MewAmpError> {
    let entries = platform.sql_localdb_entries();
    entries
        .into_iter()
        .find(|e| e.version == version)
        .ok_or_else(|| {
            MewAmpError::Installer(format!(
                "{LOG_SCOPE}: version '{version}' is not available in the manifest for this platform"
            ))
        })
}

fn uninstall_cmd_path() -> Result<PathBuf, MewAmpError> {
    Ok(state_dir()?.join(UNINSTALL_CMD_NAME))
}

/// Windows Installer writes `{GUID}` ProductCodes with braces — preserve them for `msiexec /x`.
/// Stops/deletes the named LocalDB instance before MSI removal so files are not left locked.
fn write_uninstall_helper_cmd(product_code: &str, instance_name: &str) -> Result<(), MewAmpError> {
    let path = uninstall_cmd_path()?;
    let code = product_code.trim();
    if !code.starts_with('{') || !code.ends_with('}') {
        return Err(MewAmpError::Installer(format!(
            "{LOG_SCOPE}: refusing to write uninstall helper — unexpected ProductCode shape: {code}"
        )));
    }
    validate_sql_localdb_instance_name(instance_name)?;
    let inst = instance_name.trim();
    let body = format!(
        "@echo off\r\n\
         REM Generated by MewAMP: tear down LocalDB instance then remove SqlLocalDB MSI (ProductCode).\r\n\
         sqllocaldb.exe stop {inst} 2>nul\r\n\
         sqllocaldb.exe delete {inst} 2>nul\r\n\
         msiexec.exe /x {code} /quiet /norestart\r\n"
    );
    std::fs::write(&path, body)?;
    Ok(())
}

#[derive(Debug, Serialize, Deserialize)]
struct SqlLocalDbOwnershipFile {
    installed_by_app: bool,
    version: String,
    manifest_key: String,
    product_code: String,
    install_timestamp: String,
    install_log_path: Option<String>,
    staged_msi_path: Option<String>,
    instance_name: String,
}

fn write_ownership_json(record: &SqlLocalDbInstallRecord) -> Result<(), MewAmpError> {
    let path = sql_localdb_ownership_json_path()?;
    let payload = SqlLocalDbOwnershipFile {
        installed_by_app: record.installed_by_app,
        version: record.version.clone(),
        manifest_key: record.manifest_key.clone(),
        product_code: record.product_code.clone(),
        install_timestamp: record.install_timestamp.clone(),
        install_log_path: record.install_log_path.clone(),
        staged_msi_path: record.staged_msi_path.clone(),
        instance_name: record.instance_name.clone(),
    };
    let json = serde_json::to_string_pretty(&payload).map_err(|e| MewAmpError::State(e.to_string()))?;
    std::fs::write(&path, json)?;
    Ok(())
}

/// Public so `reset_install_state` and diagnostics can drop persisted uninstall helpers safely.
pub fn clear_persisted_sql_localdb_artifacts() -> Result<(), MewAmpError> {
    let cmd = uninstall_cmd_path()?;
    if cmd.exists() {
        let _ = std::fs::remove_file(&cmd);
    }
    let json = sql_localdb_ownership_json_path()?;
    if json.exists() {
        let _ = std::fs::remove_file(&json);
    }
    Ok(())
}

#[cfg(windows)]
fn read_product_code_from_msi(msi_path: &Path) -> Result<String, MewAmpError> {
    use std::process::Stdio;

    let msi_path = msi_path
        .canonicalize()
        .map_err(|e| MewAmpError::Installer(format!("{LOG_SCOPE}: could not resolve MSI path: {e}")))?;
    let msi_str = msi_path
        .to_str()
        .ok_or_else(|| MewAmpError::Installer(format!("{LOG_SCOPE}: MSI path is not valid UTF-8")))?;

    // Pass the path via env to avoid PowerShell escaping pitfalls when paths contain spaces or quotes.
    // Direct COM calls work reliably on Windows without brittle reflection InvokeMember chains.
    let script = r#"
$ErrorActionPreference = 'Stop'
$p = $env:MEWAMP_MSI_PATH
if (-not $p -or -not (Test-Path -LiteralPath $p)) { exit 2 }
$installer = New-Object -ComObject WindowsInstaller.Installer
$db = $installer.OpenDatabase($p, 0)
$view = $db.OpenView("SELECT Value FROM Property WHERE Property='ProductCode'")
$view.Execute($null)
$rec = $view.Fetch()
if ($null -eq $rec) { exit 3 }
$code = $rec.StringData(1)
if ([string]::IsNullOrWhiteSpace($code)) { exit 4 }
Write-Output $code.Trim()
exit 0
"#;

    let output = std::process::Command::new("powershell.exe")
        .args(["-NoProfile", "-NonInteractive", "-ExecutionPolicy", "Bypass", "-Command", script])
        .env("MEWAMP_MSI_PATH", msi_str)
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .output()
        .map_err(|e| MewAmpError::Installer(format!("{LOG_SCOPE}: failed to run ProductCode probe: {e}")))?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        return Err(MewAmpError::Installer(format!(
            "{LOG_SCOPE}: could not read ProductCode from MSI (exit {:?}): {}",
            output.status.code(),
            stderr.trim()
        )));
    }

    let code = String::from_utf8_lossy(&output.stdout).trim().to_string();
    if code.is_empty() {
        return Err(MewAmpError::Installer(
            "{LOG_SCOPE}: ProductCode probe returned empty output".into(),
        ));
    }
    Ok(code)
}

#[cfg(not(windows))]
fn read_product_code_from_msi(_msi_path: &Path) -> Result<String, MewAmpError> {
    Err(MewAmpError::Installer(
        "{LOG_SCOPE}: ProductCode extraction is only implemented on Windows".into(),
    ))
}

fn interpret_msiexec_status(code: Option<i32>) -> Result<(), MewAmpError> {
    match code {
        Some(0) | Some(3010) => Ok(()), // success; 3010 = success, reboot required (we use /norestart)
        Some(c) => Err(MewAmpError::Installer(format!(
            "{LOG_SCOPE}: msiexec exited with code {c}. See the MSI log in the installer output for details."
        ))),
        None => Err(MewAmpError::Installer(
            "{LOG_SCOPE}: msiexec exited without a status code".into(),
        )),
    }
}

async fn tail_msi_log_to_installer_log(log_path: PathBuf, run: Arc<AtomicBool>) {
    let mut offset: u64 = 0;
    let mut carry: String = String::new();

    while run.load(Ordering::SeqCst) {
        let path = log_path.clone();
        let carry_in = std::mem::take(&mut carry);
        let off = offset;
        let read_result = tokio::task::spawn_blocking(move || -> Result<(u64, String, Vec<String>), std::io::Error> {
            let mut out_lines: Vec<String> = Vec::new();
            let mut offset_local = off;
            let mut carry_local = carry_in;

            let Ok(mut file) = std::fs::File::open(&path) else {
                return Ok((offset_local, carry_local, out_lines));
            };
            let Ok(meta) = file.metadata() else {
                return Ok((offset_local, carry_local, out_lines));
            };
            let len = meta.len();
            if len < offset_local {
                offset_local = 0;
                carry_local.clear();
            }
            if offset_local > len {
                offset_local = len;
            }
            file.seek(SeekFrom::Start(offset_local))?;
            let mut buf = Vec::new();
            let mut reader = std::io::BufReader::new(file);
            reader.read_to_end(&mut buf)?;
            offset_local = offset_local.saturating_add(buf.len() as u64);
            let chunk = String::from_utf8_lossy(&buf);
            let mut full = carry_local;
            full.push_str(&chunk);

            let ends_with_nl = full.ends_with('\n') || full.ends_with('\r');
            let mut iter = full.split_inclusive(|c| c == '\n').peekable();
            let mut new_carry = String::new();
            while let Some(part) = iter.next() {
                if iter.peek().is_some() || ends_with_nl {
                    let line = part.trim_end_matches(['\r', '\n']).trim();
                    if !line.is_empty() {
                        out_lines.push(line.to_string());
                    }
                } else {
                    new_carry = part.to_string();
                    break;
                }
            }
            if ends_with_nl {
                new_carry.clear();
            }
            Ok((offset_local, new_carry, out_lines))
        })
        .await;

        if let Ok(Ok((new_off, new_carry, lines))) = read_result {
            offset = new_off;
            carry = new_carry;
            for line in lines {
                let _ = append_log("installer", &format!("[{LOG_SCOPE}] {line}"));
            }
        }

        tokio::time::sleep(std::time::Duration::from_millis(300)).await;
    }

    // Final drain for any trailing bytes after msiexec stops writing.
    let path = log_path.clone();
    let carry_in = std::mem::take(&mut carry);
    let off = offset;
    match tokio::task::spawn_blocking(move || -> Result<(u64, String, Vec<String>), std::io::Error> {
        let mut out_lines: Vec<String> = Vec::new();
        let mut offset_local = off;
        let mut carry_local = carry_in;
        if let Ok(mut file) = std::fs::File::open(&path) {
            if let Ok(meta) = file.metadata() {
                let len = meta.len();
                if len < offset_local {
                    offset_local = 0;
                    carry_local.clear();
                }
                if offset_local > len {
                    offset_local = len;
                }
            }
            let _ = file.seek(SeekFrom::Start(offset_local));
            let mut buf = Vec::new();
            let mut reader = std::io::BufReader::new(file);
            let _ = reader.read_to_end(&mut buf);
            offset_local = offset_local.saturating_add(buf.len() as u64);
            let chunk = String::from_utf8_lossy(&buf);
            let mut full = carry_local;
            full.push_str(&chunk);
            for line in full.lines().map(str::trim).filter(|l| !l.is_empty()) {
                out_lines.push(line.to_string());
            }
        }
        Ok((offset_local, String::new(), out_lines))
    })
    .await
    {
        Ok(Ok((_, _, lines))) => {
            for line in lines {
                let _ = append_log("installer", &format!("[{LOG_SCOPE}] {line}"));
            }
        }
        Ok(Err(e)) => {
            let _ = append_log(
                "installer",
                &format!("[{LOG_SCOPE}] log tail final drain io error: {e}"),
            );
        }
        Err(e) => {
            let _ = append_log(
                "installer",
                &format!("[{LOG_SCOPE}] log tail final drain task error: {e}"),
            );
        }
    }
}

async fn run_msiexec(args: &[&str]) -> Result<(), MewAmpError> {
    let status = Command::new("msiexec.exe")
        .args(args)
        .status()
        .await
        .map_err(|e| MewAmpError::Installer(format!("{LOG_SCOPE}: failed to start msiexec: {e}")))?;
    interpret_msiexec_status(status.code())
}

/// Silent uninstall via ProductCode (preferred) or falls back to repair metadata only for diagnostics.
pub async fn msiexec_uninstall_by_product_code(product_code: &str) -> Result<(), MewAmpError> {
    let code = product_code.trim();
    let _ = append_log(
        "installer",
        &format!("{LOG_SCOPE}: uninstalling via msiexec /x product code"),
    );
    run_msiexec(&["/x", code, "/quiet", "/norestart"]).await
}

/// If the user opted in, download/verify the MSI, run a silent install, stream the MSI log into `installer.log`,
/// and persist ownership metadata for in-app and bundled-uninstaller removal.
pub async fn install_optional_sql_localdb(
    app: &tauri::AppHandle,
    config: &InstallConfig,
    platform: &PlatformPackages,
    cache_downloads: &Path,
    force_reinstall: bool,
) -> Result<(), MewAmpError> {
    if !cfg!(target_os = "windows") {
        if config.install_sqllocaldb {
            let _ = append_log(
                "installer",
                &format!("{LOG_SCOPE}: skipping — SqlLocalDB install is only supported on Windows"),
            );
        }
        return Ok(());
    }

    if !config.install_sqllocaldb {
        return Ok(());
    }

    let instance_name = config.sql_localdb_instance_name.trim().to_string();
    validate_sql_localdb_instance_name(&instance_name)?;

    let _ = append_log(
        "installer",
        &format!(
            "{LOG_SCOPE}: preparing install for manifest version {} (instance '{instance_name}')",
            config.sqllocaldb_version
        ),
    );

    let pkg_ref = find_sql_localdb_package(platform, config.sqllocaldb_version.trim())?;
    let manifest_key = pkg_ref.manifest_key.clone();

    let mut state = load_state()?;
    if let Some(existing) = state.sql_localdb.clone() {
        if existing.installed_by_app && existing.version == pkg_ref.version && !force_reinstall {
            if existing.instance_name == instance_name {
                let _ = append_log(
                    "installer",
                    &format!(
                        "{LOG_SCOPE}: already installed (v {}, instance '{}'). Skipping.",
                        existing.version, existing.instance_name
                    ),
                );
                return Ok(());
            }
            let _ = append_log(
                "installer",
                &format!(
                    "{LOG_SCOPE}: renaming LocalDB instance only ('{}' -> '{}' — MSI unchanged)",
                    existing.instance_name, instance_name
                ),
            );
            best_effort_sqllocaldb_teardown(&existing.instance_name).await;
            sqllocaldb_create_after_msi(&instance_name).await?;
            let mut rec = existing.clone();
            rec.instance_name = instance_name.clone();
            state.sql_localdb = Some(rec.clone());
            save_state(&state)?;
            write_ownership_json(&rec)?;
            write_uninstall_helper_cmd(&existing.product_code, &instance_name)?;
            let _ = append_log(
                "installer",
                &format!("{LOG_SCOPE}: instance set to '{instance_name}'"),
            );
            return Ok(());
        }
        if existing.installed_by_app {
            let _ = append_log(
                "installer",
                &format!(
                    "{LOG_SCOPE}: replacing prior app-managed install v {} (force={force_reinstall})",
                    existing.version
                ),
            );
            best_effort_sqllocaldb_teardown(&existing.instance_name).await;
            if let Err(e) = msiexec_uninstall_by_product_code(&existing.product_code).await {
                let _ = append_log(
                    "installer",
                    &format!("{LOG_SCOPE}: warning — could not uninstall prior MSI cleanly: {e}"),
                );
            }
            state.sql_localdb = None;
            save_state(&state)?;
            let _ = clear_persisted_sql_localdb_artifacts();
        }
    }

    let msi_cache = cache_downloads.join(format!(
        "sqllocaldb-{}-{}.msi",
        pkg_ref.version,
        pkg_ref.sha256.chars().take(8).collect::<String>()
    ));

    if msi_cache.exists() && !force_reinstall {
        let _ = append_log(
            "installer",
            &format!("{LOG_SCOPE}: found cached MSI at {:?}", msi_cache),
        );
        if verify_sha256(&msi_cache, &pkg_ref.sha256).is_err() {
            let _ = append_log(
                "installer",
                &format!("{LOG_SCOPE}: cached MSI checksum mismatch — redownloading"),
            );
            let _ = std::fs::remove_file(&msi_cache);
        }
    }

    if !msi_cache.exists() {
        let _ = append_log(
            "installer",
            &format!("{LOG_SCOPE}: downloading MSI from {}", pkg_ref.primary_url),
        );
        download_with_progress(app, &pkg_ref.primary_url, &msi_cache, "installer").await?;
        let _ = append_log("installer", &format!("{LOG_SCOPE}: verifying MSI checksum"));
        verify_sha256(&msi_cache, &pkg_ref.sha256)?;
    } else {
        let _ = append_log("installer", &format!("{LOG_SCOPE}: verifying MSI checksum"));
        verify_sha256(&msi_cache, &pkg_ref.sha256)?;
    }

    let product_code = read_product_code_from_msi(&msi_cache)?;
    let _ = append_log(
        "installer",
        &format!("{LOG_SCOPE}: extracted ProductCode from MSI database: {product_code}"),
    );

    let ts = Utc::now().format("%Y%m%d-%H%M%S");
    let logs_root = crate::state::app_root_dir()?
        .join("app")
        .join("logs");
    std::fs::create_dir_all(&logs_root)?;
    let msi_log = logs_root.join(format!("sqllocaldb_msi_{}_{}.log", pkg_ref.version, ts));
    let msi_log_str = msi_log
        .to_str()
        .ok_or_else(|| MewAmpError::Installer(format!("{LOG_SCOPE}: MSI log path is not valid UTF-8")))?;
    let msi_path_str = msi_cache
        .to_str()
        .ok_or_else(|| MewAmpError::Installer(format!("{LOG_SCOPE}: staged MSI path is not valid UTF-8")))?;

    let run_tail = Arc::new(AtomicBool::new(true));
    let tail_flag = run_tail.clone();
    let tail_path = msi_log.clone();
    let tail_task = tokio::spawn(async move {
        tail_msi_log_to_installer_log(tail_path, tail_flag).await;
    });

    let _ = append_log(
        "installer",
        &format!(
            "{LOG_SCOPE}: running msiexec /i (silent). MSI log file: {:?}",
            msi_log
        ),
    );

    let status = Command::new("msiexec.exe")
        .arg("/i")
        .arg(msi_path_str)
        .args(["/quiet", "/norestart", "/L*v", msi_log_str])
        .status()
        .await
        .map_err(|e| {
            run_tail.store(false, Ordering::SeqCst);
            MewAmpError::Installer(format!("{LOG_SCOPE}: failed to start msiexec for install: {e}"))
        })?;

    run_tail.store(false, Ordering::SeqCst);
    let _ = tail_task.await;

    interpret_msiexec_status(status.code())?;

    sqllocaldb_create_after_msi(&instance_name).await?;

    let timestamp = Utc::now().to_rfc3339();
    let record = SqlLocalDbInstallRecord {
        installed_by_app: true,
        version: pkg_ref.version.clone(),
        manifest_key,
        product_code: product_code.clone(),
        install_timestamp: timestamp.clone(),
        install_log_path: Some(msi_log.to_string_lossy().to_string()),
        staged_msi_path: Some(msi_cache.to_string_lossy().to_string()),
        instance_name: instance_name.clone(),
    };

    state = load_state()?;
    state.sql_localdb = Some(record.clone());
    save_state(&state)?;

    write_ownership_json(&record)?;
    write_uninstall_helper_cmd(&product_code, &instance_name)?;

    let _ = append_log(
        "installer",
        &format!("{LOG_SCOPE}: install finished successfully for version {}", pkg_ref.version),
    );

    Ok(())
}

/// Remove SqlLocalDB when this app previously recorded an install. Safe no-op if nothing is recorded.
pub async fn uninstall_app_managed_sql_localdb() -> Result<(), MewAmpError> {
    if !cfg!(target_os = "windows") {
        return Ok(());
    }

    let mut state = load_state()?;
    let Some(record) = state.sql_localdb.clone() else {
        let _ = append_log("installer", &format!("{LOG_SCOPE}: no app-managed install recorded; nothing to remove"));
        return Ok(());
    };

    if !record.installed_by_app {
        return Err(MewAmpError::Installer(format!(
            "{LOG_SCOPE}: refusing uninstall — record is not marked installed_by_app"
        )));
    }

    let _ = append_log(
        "installer",
        &format!(
            "{LOG_SCOPE}: removing app-managed SqlLocalDB v {} instance '{}' (ProductCode {})",
            record.version, record.instance_name, record.product_code
        ),
    );

    best_effort_sqllocaldb_teardown(&record.instance_name).await;
    msiexec_uninstall_by_product_code(&record.product_code).await?;

    state.sql_localdb = None;
    save_state(&state)?;
    clear_persisted_sql_localdb_artifacts()?;
    let _ = append_log("installer", &format!("{LOG_SCOPE}: uninstall completed"));
    Ok(())
}
