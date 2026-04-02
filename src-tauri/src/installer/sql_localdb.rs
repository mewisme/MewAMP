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

const LOG_SCOPE: &str = "SqlLocalDB";

pub fn default_sqllocaldb_version() -> String {
    "2022".into()
}

pub fn default_sql_localdb_instance_name() -> String {
    "MewAMP".into()
}

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

#[cfg(windows)]
fn try_where_sqllocaldb_exe() -> Option<PathBuf> {
    use std::os::windows::process::CommandExt;
    const CREATE_NO_WINDOW: u32 = 0x08000000;
    let mut cmd = std::process::Command::new("where.exe");
    cmd.args(["sqllocaldb"]).creation_flags(CREATE_NO_WINDOW);
    let out = cmd.output().ok()?;
    if !out.status.success() {
        return None;
    }
    let line = String::from_utf8_lossy(&out.stdout).lines().next()?.trim().to_string();
    if line.is_empty() {
        return None;
    }
    let p = PathBuf::from(line);
    p.is_file().then_some(p)
}

#[cfg(windows)]
fn scan_standard_sqllocaldb_installations() -> Option<PathBuf> {
    let mut found: Vec<(u32, PathBuf)> = Vec::new();
    for pf_key in ["ProgramFiles", "ProgramFiles(x86)"] {
        let Ok(root) = std::env::var(pf_key) else {
            continue;
        };
        let sql_root = PathBuf::from(root).join("Microsoft SQL Server");
        if let Ok(rd) = std::fs::read_dir(&sql_root) {
            for ent in rd.flatten() {
                let name = ent.file_name().to_string_lossy().to_string();
                if let Ok(n) = name.parse::<u32>() {
                    let exe = ent.path().join("Tools").join("Binn").join("SqlLocalDB.exe");
                    if exe.is_file() {
                        found.push((n, exe));
                    }
                }
            }
        }
        let odbc_root = sql_root.join("Client SDK").join("ODBC");
        if let Ok(rd) = std::fs::read_dir(&odbc_root) {
            for ent in rd.flatten() {
                if let Ok(n) = ent.file_name().to_string_lossy().parse::<u32>() {
                    let exe = ent.path().join("Tools").join("Binn").join("SqlLocalDB.exe");
                    if exe.is_file() {
                        found.push((n, exe));
                    }
                }
            }
        }
    }
    found.sort_by_key(|(n, _)| std::cmp::Reverse(*n));
    found.into_iter().next().map(|(_, p)| p)
}

#[cfg(windows)]
fn resolve_sqllocaldb_exe_path() -> PathBuf {
    if let Some(p) = try_where_sqllocaldb_exe() {
        return p;
    }
    if let Some(p) = scan_standard_sqllocaldb_installations() {
        return p;
    }
    PathBuf::from("sqllocaldb.exe")
}

#[cfg(not(windows))]
fn resolve_sqllocaldb_exe_path() -> PathBuf {
    PathBuf::from("sqllocaldb.exe")
}

fn sqllocaldb_exe_line_in_batch(exe: &Path) -> String {
    let s = exe.to_string_lossy();
    if s.eq_ignore_ascii_case("sqllocaldb.exe") || !s.contains(' ') {
        return s.into_owned();
    }
    format!("\"{}\"", s.replace('\"', "\"\""))
}

pub async fn run_sqllocaldb_cli(subcommand: &str, instance: &str) -> Result<(Option<i32>, String), MewAmpError> {
    if !cfg!(target_os = "windows") {
        return Err(MewAmpError::Installer(
            "{LOG_SCOPE}: sqllocaldb CLI is only available on Windows".into(),
        ));
    }
    validate_sql_localdb_instance_name(instance)?;
    let trimmed = instance.trim();
    let resolved = match list_sql_localdb_instance_names().await {
        Ok(names) => names
            .into_iter()
            .find(|n| n.eq_ignore_ascii_case(trimmed))
            .unwrap_or_else(|| trimmed.to_string()),
        Err(_) => trimmed.to_string(),
    };
    let exe = resolve_sqllocaldb_exe_path();
    let mut cmd = Command::new(&exe);
    cmd.arg(subcommand).arg(resolved);
    #[cfg(windows)]
    cmd.creation_flags(0x08000000);
    let output = cmd.output().await.map_err(|e| {
        MewAmpError::Installer(format!(
            "{LOG_SCOPE}: failed to execute {} {subcommand}: {e}",
            exe.display()
        ))
    })?;
    let code = output.status.code();
    let stdout = String::from_utf8_lossy(&output.stdout);
    let stderr = String::from_utf8_lossy(&output.stderr);
    let text = format!("{stdout}{stderr}").trim().to_string();
    Ok((code, text))
}

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
        let raw = rest[1..].trim();
        let first = raw
            .split_whitespace()
            .next()
            .unwrap_or("")
            .trim_matches(|c| c == '.' || c == ',');
        let v = first.to_lowercase();
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

#[cfg(windows)]
pub async fn list_sql_localdb_instance_names() -> Result<Vec<String>, MewAmpError> {
    let exe = resolve_sqllocaldb_exe_path();
    let mut cmd = Command::new(&exe);
    cmd.arg("info");
    cmd.creation_flags(0x08000000);
    let output = cmd.output().await.map_err(|e| {
        MewAmpError::Installer(format!(
            "{LOG_SCOPE}: could not run '{} info' (is SqlLocalDB installed?): {e}",
            exe.display()
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

pub async fn sql_localdb_runtime_is_available() -> bool {
    if !cfg!(target_os = "windows") {
        return false;
    }
    list_sql_localdb_instance_names().await.is_ok()
}

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

fn sql_localdb_selector_matches_pkg(selector: &str, pkg: &SqlLocalDbManifestPackage) -> bool {
    let s = selector.trim();
    s == pkg.version || s == pkg.release_year
}

fn product_code_from_manifest(pkg: &SqlLocalDbManifestPackage) -> Result<String, MewAmpError> {
    let Some(raw) = pkg.product_code.as_ref() else {
        return Err(MewAmpError::Installer(format!(
            "{LOG_SCOPE}: manifest entry '{}' is missing productCode (required for uninstall)",
            pkg.manifest_key
        )));
    };
    let code = raw.trim();
    if !code.starts_with('{') || !code.ends_with('}') || code.len() < 3 {
        return Err(MewAmpError::Installer(format!(
            "{LOG_SCOPE}: manifest productCode for '{}' must be a braced GUID, got: {code}",
            pkg.manifest_key
        )));
    }
    Ok(code.to_string())
}

fn find_sql_localdb_package(
    platform: &PlatformPackages,
    version: &str,
) -> Result<SqlLocalDbManifestPackage, MewAmpError> {
    let entries = platform.sql_localdb_entries();
    entries
        .into_iter()
        .find(|e| sql_localdb_selector_matches_pkg(version, e))
        .ok_or_else(|| {
            MewAmpError::Installer(format!(
                "{LOG_SCOPE}: version '{version}' is not available in the manifest for this platform"
            ))
        })
}

fn uninstall_cmd_path() -> Result<PathBuf, MewAmpError> {
    Ok(state_dir()?.join(UNINSTALL_CMD_NAME))
}

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
    let sqlexe = sqllocaldb_exe_line_in_batch(&resolve_sqllocaldb_exe_path());
    let body = format!(
        "@echo off\r\n\
         {sqlexe} stop {inst} 2>nul\r\n\
         {sqlexe} delete {inst} 2>nul\r\n\
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
fn is_process_elevated_admin() -> bool {
    #[link(name = "shell32")]
    extern "system" {
        fn IsUserAnAdmin() -> i32;
    }
    unsafe { IsUserAnAdmin() != 0 }
}

#[cfg(windows)]
fn require_elevated_for_sql_localdb_msi() -> Result<(), MewAmpError> {
    if is_process_elevated_admin() {
        return Ok(());
    }
    let user_msg = "SqlLocalDB MSI requires an elevated (Administrator) process. \
        Restart MewAMP with \"Run as administrator\", then retry the installation."
        .to_string();
    let _ = append_log(
        "installer",
        &format!("{LOG_SCOPE}: aborting — process is not elevated: {user_msg}"),
    );
    Err(MewAmpError::Installer(user_msg))
}

#[cfg(not(windows))]
fn require_elevated_for_sql_localdb_msi() -> Result<(), MewAmpError> {
    Ok(())
}

fn interpret_msiexec_status(code: Option<i32>) -> Result<(), MewAmpError> {
    match code {
        Some(0) | Some(3010) => Ok(()),
        Some(c) => Err(MewAmpError::Installer(format!(
            "{LOG_SCOPE}: msiexec exited with code {c}. See the MSI log in the installer output for details."
        ))),
        None => Err(MewAmpError::Installer(
            "{LOG_SCOPE}: msiexec exited without a status code".into(),
        )),
    }
}

#[cfg(windows)]
fn quote_cmd_token_for_cmd_c(s: &str) -> String {
    let needs_quote = s.is_empty()
        || s.chars().any(|c| {
            c.is_whitespace() || matches!(c, '&' | '|' | '(' | ')' | '<' | '>' | '^' | '%' | '"' | '!')
        });
    if needs_quote {
        format!("\"{}\"", s.replace('\"', "\"\""))
    } else {
        s.to_string()
    }
}

#[cfg(windows)]
async fn run_msiexec(args: &[&str]) -> Result<(), MewAmpError> {
    require_elevated_for_sql_localdb_msi()?;

    const CREATE_NO_WINDOW: u32 = 0x08000000;

    let mut line = String::from("msiexec.exe");
    for &a in args {
        line.push(' ');
        line.push_str(&quote_cmd_token_for_cmd_c(a));
    }
    let status = Command::new("cmd.exe")
        .arg("/c")
        .arg(line)
        .creation_flags(CREATE_NO_WINDOW)
        .status()
        .await
        .map_err(|e| {
            MewAmpError::Installer(format!(
                "{LOG_SCOPE}: failed to start cmd.exe for msiexec: {e}"
            ))
        })?;
    interpret_msiexec_status(status.code())
}

#[cfg(not(windows))]
async fn run_msiexec(args: &[&str]) -> Result<(), MewAmpError> {
    let status = Command::new("msiexec.exe")
        .args(args)
        .status()
        .await
        .map_err(|e| MewAmpError::Installer(format!("{LOG_SCOPE}: failed to start msiexec: {e}")))?;
    interpret_msiexec_status(status.code())
}

fn decode_utf16_le_bytes(bytes: &[u8]) -> String {
    debug_assert!(bytes.len() % 2 == 0);
    let u16s: Vec<u16> = bytes
        .chunks_exact(2)
        .map(|pair| u16::from_le_bytes([pair[0], pair[1]]))
        .collect();
    String::from_utf16_lossy(&u16s)
}

fn push_msi_log_utf16le(pending: &mut Vec<u8>, chunk: &[u8]) -> String {
    pending.extend_from_slice(chunk);
    let trailing = pending.len() % 2;
    let decode_len = pending.len() - trailing;
    if decode_len == 0 {
        return String::new();
    }
    let decoded = decode_utf16_le_bytes(&pending[..decode_len]);
    pending.drain(..decode_len);
    decoded
}

async fn tail_msi_log_to_installer_log(log_path: PathBuf, run: Arc<AtomicBool>) {
    let mut offset: u64 = 0;
    let mut pending_utf16: Vec<u8> = Vec::new();
    let mut carry_line: String = String::new();
    let mut strip_leading_bom: bool = true;

    while run.load(Ordering::SeqCst) {
        let path = log_path.clone();
        let carry_in = std::mem::take(&mut carry_line);
        let pending_in = std::mem::take(&mut pending_utf16);
        let off = offset;
        let strip_bom = strip_leading_bom;
        let read_result = tokio::task::spawn_blocking(move || -> Result<(u64, Vec<u8>, String, Vec<String>, bool), std::io::Error> {
            let mut out_lines: Vec<String> = Vec::new();
            let mut offset_local = off;
            let mut carry_local = carry_in;
            let mut pending_local = pending_in;
            let mut strip_bom_local = strip_bom;

            let Ok(mut file) = std::fs::File::open(&path) else {
                return Ok((offset_local, pending_local, carry_local, out_lines, strip_bom_local));
            };
            let Ok(meta) = file.metadata() else {
                return Ok((offset_local, pending_local, carry_local, out_lines, strip_bom_local));
            };
            let len = meta.len();
            if len < offset_local {
                offset_local = 0;
                carry_local.clear();
                pending_local.clear();
                strip_bom_local = true;
            }
            if offset_local > len {
                offset_local = len;
            }
            file.seek(SeekFrom::Start(offset_local))?;
            let mut buf = Vec::new();
            let mut reader = std::io::BufReader::new(file);
            reader.read_to_end(&mut buf)?;
            offset_local = offset_local.saturating_add(buf.len() as u64);
            let mut chunk = push_msi_log_utf16le(&mut pending_local, &buf);
            if strip_bom_local && !chunk.is_empty() {
                if chunk.starts_with('\u{FEFF}') {
                    chunk.drain(..'\u{FEFF}'.len_utf8());
                }
                strip_bom_local = false;
            }
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
            Ok((offset_local, pending_local, new_carry, out_lines, strip_bom_local))
        })
        .await;

        if let Ok(Ok((new_off, new_pending, new_carry, lines, next_strip_bom))) = read_result {
            offset = new_off;
            pending_utf16 = new_pending;
            carry_line = new_carry;
            strip_leading_bom = next_strip_bom;
            for line in lines {
                let _ = append_log("installer", &format!("[{LOG_SCOPE}] {line}"));
            }
        }

        tokio::time::sleep(std::time::Duration::from_millis(300)).await;
    }

    let path = log_path.clone();
    let carry_in = std::mem::take(&mut carry_line);
    let pending_in = std::mem::take(&mut pending_utf16);
    let off = offset;
    let strip_bom = strip_leading_bom;
    match tokio::task::spawn_blocking(move || -> Result<(u64, Vec<String>), std::io::Error> {
        let mut out_lines: Vec<String> = Vec::new();
        let mut offset_local = off;
        let mut carry_local = carry_in;
        let mut pending_local = pending_in;
        let mut strip_bom_local = strip_bom;
        if let Ok(mut file) = std::fs::File::open(&path) {
            if let Ok(meta) = file.metadata() {
                let len = meta.len();
                if len < offset_local {
                    offset_local = 0;
                    carry_local.clear();
                    pending_local.clear();
                    strip_bom_local = true;
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
            let mut chunk = push_msi_log_utf16le(&mut pending_local, &buf);
            if strip_bom_local && !chunk.is_empty() {
                if chunk.starts_with('\u{FEFF}') {
                    chunk.drain(..'\u{FEFF}'.len_utf8());
                }
            }
            let mut full = carry_local;
            full.push_str(&chunk);
            for line in full.lines().map(str::trim).filter(|l| !l.is_empty()) {
                out_lines.push(line.to_string());
            }
        }
        Ok((offset_local, out_lines))
    })
    .await
    {
        Ok(Ok((_, lines))) => {
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

pub async fn msiexec_uninstall_by_product_code(product_code: &str) -> Result<(), MewAmpError> {
    let code = product_code.trim();
    let _ = append_log(
        "installer",
        &format!("{LOG_SCOPE}: uninstalling via msiexec /x product code"),
    );
    run_msiexec(&["/x", code, "/quiet", "/norestart"]).await
}

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
        if existing.installed_by_app
            && sql_localdb_selector_matches_pkg(&existing.version, &pkg_ref)
            && !force_reinstall
        {
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

    #[cfg(windows)]
    require_elevated_for_sql_localdb_msi()?;

    let msi_cache = cache_downloads.join(format!(
        "sqllocaldb-{}-{}.msi",
        pkg_ref.release_year,
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

    let product_code = product_code_from_manifest(&pkg_ref)?;
    let _ = append_log(
        "installer",
        &format!("{LOG_SCOPE}: using ProductCode from manifest for uninstall helpers: {product_code}"),
    );

    let ts = Utc::now().format("%Y%m%d-%H%M%S");
    let logs_root = crate::state::app_root_dir()?
        .join("app")
        .join("logs");
    std::fs::create_dir_all(&logs_root)?;
    let msi_log = logs_root.join(format!(
        "sqllocaldb_msi_{}_{}.log",
        pkg_ref.release_year,
        ts
    ));
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
            "{LOG_SCOPE}: running cmd /c msiexec /i … IACCEPTSQLLOCALDBLICENSETERMS=YES /quiet /norestart /log … — MSI log: {:?}",
            msi_log
        ),
    );

    let install_result = run_msiexec(&[
        "/i",
        msi_path_str,
        "IACCEPTSQLLOCALDBLICENSETERMS=YES",
        "/quiet",
        "/norestart",
        "/log",
        msi_log_str,
    ])
    .await;

    run_tail.store(false, Ordering::SeqCst);
    let _ = tail_task.await;

    install_result?;

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
        &format!(
            "{LOG_SCOPE}: install finished successfully ({} {})",
            pkg_ref.release_year, pkg_ref.version
        ),
    );

    Ok(())
}

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
