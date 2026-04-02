use std::{
    env,
    fs,
    path::{Path, PathBuf},
};

use serde::{Deserialize, Serialize};
use tokio::{
    process::{Child, Command},
    time::{sleep, Duration},
};

use crate::{
    archive::extract_zip,
    checksum::verify_sha256,
    downloader::download_with_progress,
    error::MewAmpError,
    healthcheck::{check_http, check_tcp_local},
    installer::{config_gen::*, database::initialize_mariadb_data},
    manifest::resolver::resolve_manifest,
    logs::append_log,
    state::{app_root_dir, load_state, save_state},
};

pub mod config_gen;
pub mod database;
pub mod sql_localdb;

fn default_sqllocaldb_version_for_config() -> String {
    sql_localdb::default_sqllocaldb_version()
}

fn default_sqllocaldb_instance_name_for_config() -> String {
    sql_localdb::default_sql_localdb_instance_name()
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct InstallConfig {
    pub runtime_root: String,
    pub data_root: String,
    pub apache_http_port: u16,
    pub apache_https_port: u16,
    pub mariadb_port: u16,
    pub install_phpmyadmin: bool,
    #[serde(default)]
    pub force_reinstall: bool,
    /// Windows-only optional component; ignored on other platforms.
    #[serde(default)]
    pub install_sqllocaldb: bool,
    /// Manifest `version` field for the selected SqlLocalDB package (default `2022`).
    #[serde(default = "default_sqllocaldb_version_for_config")]
    pub sqllocaldb_version: String,
    /// LocalDB instance name: letters, digits, underscore only (default `MewAMP`).
    #[serde(default = "default_sqllocaldb_instance_name_for_config")]
    pub sql_localdb_instance_name: String,
}

fn component_dir(base: &Path, name: &str) -> PathBuf {
    base.join(name)
}

fn find_executable_recursive(dir: &Path, executable_name: &str) -> Option<PathBuf> {
    if !dir.exists() {
        return None;
    }

    let entries = fs::read_dir(dir).ok()?;
    for entry in entries.flatten() {
        let path = entry.path();
        if path.is_file() {
            let is_match = path
                .file_name()
                .and_then(|n| n.to_str())
                .map(|n| n.eq_ignore_ascii_case(executable_name))
                .unwrap_or(false);
            if is_match {
                return Some(path);
            }
        } else if path.is_dir() {
            if let Some(found) = find_executable_recursive(&path, executable_name) {
                return Some(found);
            }
        }
    }
    None
}

fn component_root_from_exe(exe_path: &Path) -> Result<PathBuf, MewAmpError> {
    let bin_dir = exe_path
        .parent()
        .ok_or_else(|| MewAmpError::Installer("missing bin directory".to_string()))?;
    let root = bin_dir
        .parent()
        .ok_or_else(|| MewAmpError::Installer("missing component root directory".to_string()))?;
    Ok(root.to_path_buf())
}

fn with_prepended_path(bin_dir: &Path) -> String {
    let existing = env::var("PATH").unwrap_or_default();
    format!("{};{}", bin_dir.to_string_lossy(), existing)
}

async fn kill_windows_process(image_name: &str) -> Result<(), MewAmpError> {
    let status = Command::new("taskkill")
        .arg("/IM")
        .arg(image_name)
        .arg("/F")
        .arg("/T")
        .status()
        .await
        .map_err(|e| MewAmpError::Installer(format!("failed to execute taskkill for {image_name}: {e}")))?;

    // taskkill returns non-zero when process doesn't exist; treat as non-fatal.
    if status.success() {
        Ok(())
    } else {
        Ok(())
    }
}

async fn ensure_runtime_processes_stopped() -> Result<(), MewAmpError> {
    let process_names = ["httpd.exe", "mysqld.exe", "php-cgi.exe", "mysqladmin.exe"];
    for name in process_names {
        kill_windows_process(name).await?;
    }
    Ok(())
}

pub async fn run_install(app: &tauri::AppHandle, config: InstallConfig) -> Result<(), MewAmpError> {
    let _ = append_log("installer", "Starting install pipeline");
    let _ = append_log("installer", "Stopping existing runtime processes before install");
    ensure_runtime_processes_stopped().await?;
    let _ = append_log("installer", "Process cleanup completed");
    let resolved = resolve_manifest().await?;
    let _ = append_log(
        "installer",
        &format!(
            "Manifest selected: source={}, version={}",
            resolved.source, resolved.manifest.manifest_version
        ),
    );
    let platform = resolved
        .manifest
        .packages
        .get("windows-x64")
        .ok_or_else(|| MewAmpError::Manifest("missing windows-x64 package group".into()))?;

    let root = if config.runtime_root.trim().is_empty() {
        app_root_dir()?
    } else {
        PathBuf::from(&config.runtime_root)
    };

    let runtime_root = root.join("runtime");
    let cache_downloads = root.join("cache").join("downloads");
    let cache_extracted = root.join("cache").join("extracted");
    let config_root = root.join("config");
    let data_root = if config.data_root.trim().is_empty() {
        root.join("data")
    } else {
        PathBuf::from(&config.data_root)
    };
    fs::create_dir_all(&runtime_root)?;
    fs::create_dir_all(&cache_downloads)?;
    fs::create_dir_all(&cache_extracted)?;
    fs::create_dir_all(&config_root)?;

    let packages = [
        ("apache", &platform.apache),
        ("php", &platform.php),
        ("mariadb", &platform.mariadb),
        ("phpmyadmin", &platform.phpmyadmin),
    ];

    let mut state = load_state()?;
    let runtime_matches_manifest = state.install_completed
        && state.selected_manifest_version == resolved.manifest.manifest_version
        && state.runtime_root == runtime_root.to_string_lossy()
        && state.installed_components.apache.as_deref() == Some(platform.apache.version.as_str())
        && state.installed_components.php.as_deref() == Some(platform.php.version.as_str())
        && state.installed_components.mariadb.as_deref() == Some(platform.mariadb.version.as_str())
        && (!config.install_phpmyadmin
            || state.installed_components.phpmyadmin.as_deref() == Some(platform.phpmyadmin.version.as_str()));

    let runtime_dirs_exist = runtime_root.join("apache").exists()
        && runtime_root.join("php").exists()
        && runtime_root.join("mariadb").exists()
        && (!config.install_phpmyadmin || runtime_root.join("phpmyadmin").exists());

    if !config.force_reinstall && runtime_matches_manifest && runtime_dirs_exist {
        let _ = append_log(
            "installer",
            "Runtime already installed with same manifest versions. Skipping download and reinstall.",
        );
        state.install_completed = true;
        state.ports.apache_http = config.apache_http_port;
        state.ports.apache_https = config.apache_https_port;
        state.ports.mariadb = config.mariadb_port;
        save_state(&state)?;
        sql_localdb::install_optional_sql_localdb(
            app,
            &config,
            platform,
            &cache_downloads,
            config.force_reinstall,
        )
        .await?;
        return Ok(());
    }

    if config.force_reinstall {
        let _ = append_log(
            "installer",
            "Force reinstall enabled. Existing runtime will be redownloaded and replaced.",
        );
    }

    for (name, pkg) in packages {
        if name == "phpmyadmin" && !config.install_phpmyadmin {
            let _ = append_log("installer", "Skipping phpMyAdmin by user choice");
            continue;
        }

        let archive_path = cache_downloads.join(format!("{name}-{}.zip", pkg.version));
        if archive_path.exists() {
            let _ = append_log(
                "installer",
                &format!("Found cached archive for {name}. Verifying checksum before reuse."),
            );
            match verify_sha256(&archive_path, &pkg.sha256) {
                Ok(()) => {
                    let _ = append_log(
                        "installer",
                        &format!("Cached archive checksum valid for {name}. Skipping redownload."),
                    );
                }
                Err(_) => {
                    let _ = append_log(
                        "installer",
                        &format!("Cached archive checksum mismatch for {name}. Redownloading."),
                    );
                    let _ = fs::remove_file(&archive_path);
                    let _ = append_log("installer", &format!("Downloading {name} {}", pkg.version));
                    download_with_progress(app, &pkg.primary_url, &archive_path, "installer").await?;
                    let _ = append_log("installer", &format!("Verifying checksum for {name}"));
                    verify_sha256(&archive_path, &pkg.sha256)?;
                }
            }
        } else {
            let _ = append_log("installer", &format!("Downloading {name} {}", pkg.version));
            download_with_progress(app, &pkg.primary_url, &archive_path, "installer").await?;
            let _ = append_log("installer", &format!("Verifying checksum for {name}"));
            verify_sha256(&archive_path, &pkg.sha256)?;
        }

        let extract_dir = cache_extracted.join(name);
        if extract_dir.exists() {
            fs::remove_dir_all(&extract_dir)?;
        }
        extract_zip(&archive_path, &extract_dir)?;
        let _ = append_log("installer", &format!("Extracted {name} archive"));

        let target = component_dir(&runtime_root, name);
        if target.exists() {
            fs::remove_dir_all(&target)?;
        }
        fs::rename(&extract_dir, &target)?;
    }

    let apache_exe = find_executable_recursive(&runtime_root.join("apache"), "httpd.exe")
        .ok_or_else(|| MewAmpError::Installer("httpd.exe not found after extraction".to_string()))?;
    let apache_root = component_root_from_exe(&apache_exe)?;
    let mysqld_path = find_executable_recursive(&runtime_root.join("mariadb"), "mysqld.exe")
        .ok_or_else(|| MewAmpError::Installer("mysqld.exe not found after extraction".to_string()))?;

    write_apache_config(
        &config_root.join("apache"),
        &apache_root,
        config.apache_http_port,
        config.apache_https_port,
    )?;
    write_php_config(&config_root.join("php"))?;
    write_mariadb_config(
        &config_root.join("mariadb"),
        config.mariadb_port,
        &data_root.join("mariadb"),
    )?;

    initialize_mariadb_data(&mysqld_path, &data_root.join("mariadb")).await?;
    let _ = append_log("installer", "MariaDB data directory initialized");

    let mariadb_conf = config_root.join("mariadb").join("my.ini");
    let apache_conf = config_root.join("apache").join("httpd.conf");
    let mariadb_bin = mysqld_path
        .parent()
        .ok_or_else(|| MewAmpError::Installer("mariadb bin dir not found".to_string()))?;
    let apache_bin = apache_exe
        .parent()
        .ok_or_else(|| MewAmpError::Installer("apache bin dir not found".to_string()))?;

    let _ = append_log("installer", "Starting MariaDB for health validation");
    let mut mariadb_child: Child = Command::new(&mysqld_path)
        .arg(format!("--defaults-file={}", mariadb_conf.to_string_lossy()))
        .arg("--console")
        .current_dir(mariadb_bin)
        .env("PATH", with_prepended_path(mariadb_bin))
        .spawn()
        .map_err(|e| MewAmpError::Installer(format!("failed to start mariadb: {e}")))?;

    sleep(Duration::from_secs(2)).await;

    let _ = append_log("installer", "Starting Apache for health validation");
    let apache_test = Command::new(&apache_exe)
        .arg("-t")
        .arg("-f")
        .arg(apache_conf.to_string_lossy().to_string())
        .current_dir(&apache_root)
        .env("PATH", with_prepended_path(apache_bin))
        .output()
        .await
        .map_err(|e| MewAmpError::Installer(format!("failed to run apache config test: {e}")))?;
    if !apache_test.status.success() {
        let stdout = String::from_utf8_lossy(&apache_test.stdout);
        let stderr = String::from_utf8_lossy(&apache_test.stderr);
        let _ = append_log(
            "installer",
            &format!(
                "Apache config test failed. stdout: {} stderr: {}",
                stdout.trim(),
                stderr.trim()
            ),
        );
        let _ = mariadb_child.kill().await;
        return Err(MewAmpError::Installer(
            "Apache config test failed before startup".to_string(),
        ));
    }

    let mut apache_child: Child = Command::new(&apache_exe)
        .arg("-f")
        .arg(apache_conf.to_string_lossy().to_string())
        .arg("-DFOREGROUND")
        .current_dir(&apache_root)
        .env("PATH", with_prepended_path(apache_bin))
        .spawn()
        .map_err(|e| MewAmpError::Installer(format!("failed to start apache: {e}")))?;

    let mut apache_ok = false;
    for _ in 0..10 {
        sleep(Duration::from_millis(800)).await;
        match check_http(&format!("http://127.0.0.1:{}", config.apache_http_port)).await {
            Ok(true) => {
                apache_ok = true;
                break;
            }
            Ok(false) => {}
            Err(err) => {
                let _ = append_log("installer", &format!("Apache health request failed: {err}"));
            }
        }
    }
    let db_ok = check_tcp_local(config.mariadb_port);
    let _ = append_log(
        "installer",
        &format!("Health checks: apache_ok={apache_ok}, mariadb_tcp_ok={db_ok}"),
    );

    let _ = apache_child.kill().await;
    let _ = mariadb_child.kill().await;

    if !apache_ok || !db_ok {
        return Err(MewAmpError::Health(
            "service health checks did not pass after starting runtime".to_string(),
        ));
    }

    state = load_state()?;
    state.install_completed = true;
    state.runtime_root = runtime_root.to_string_lossy().to_string();
    state.config_root = config_root.to_string_lossy().to_string();
    state.data_root = data_root.to_string_lossy().to_string();
    state.ports.apache_http = config.apache_http_port;
    state.ports.apache_https = config.apache_https_port;
    state.ports.mariadb = config.mariadb_port;
    state.installed_components.apache = Some(platform.apache.version.clone());
    state.installed_components.php = Some(platform.php.version.clone());
    state.installed_components.mariadb = Some(platform.mariadb.version.clone());
    state.installed_components.phpmyadmin = if config.install_phpmyadmin {
        Some(platform.phpmyadmin.version.clone())
    } else {
        None
    };
    save_state(&state)?;
    sql_localdb::install_optional_sql_localdb(
        app,
        &config,
        platform,
        &cache_downloads,
        config.force_reinstall,
    )
    .await?;
    ensure_runtime_processes_stopped().await?;
    let _ = append_log(
        "installer",
        "Stopped runtime services after install to keep setup completion clean",
    );
    let _ = append_log("installer", "Install pipeline completed");

    Ok(())
}
