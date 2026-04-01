use std::path::Path;

use tokio::process::Command;

use crate::error::MewAmpError;

async fn clear_dir_contents(dir: &Path) -> Result<(), MewAmpError> {
    tokio::fs::create_dir_all(dir)
        .await
        .map_err(|e| MewAmpError::Installer(e.to_string()))?;

    let mut entries = tokio::fs::read_dir(dir)
        .await
        .map_err(|e| MewAmpError::Installer(e.to_string()))?;
    while let Some(entry) = entries
        .next_entry()
        .await
        .map_err(|e| MewAmpError::Installer(e.to_string()))?
    {
        let path = entry.path();
        if path.is_dir() {
            tokio::fs::remove_dir_all(&path)
                .await
                .map_err(|e| MewAmpError::Installer(e.to_string()))?;
        } else {
            tokio::fs::remove_file(&path)
                .await
                .map_err(|e| MewAmpError::Installer(e.to_string()))?;
        }
    }
    Ok(())
}

pub async fn initialize_mariadb_data(mysqld_path: &Path, data_dir: &Path) -> Result<(), MewAmpError> {
    let mysql_system_db = data_dir.join("mysql");
    if mysql_system_db.exists() {
        return Ok(());
    }

    // If data dir exists but is incomplete (e.g. from failed previous init),
    // clear it so bootstrap starts from a truly empty directory.
    clear_dir_contents(data_dir).await?;

    let status = Command::new(mysqld_path)
        .arg(format!(
            "--basedir={}",
            mysqld_path
                .parent()
                .and_then(|p| p.parent())
                .map(|p| p.to_string_lossy().to_string())
                .unwrap_or_default()
        ))
        .arg("--initialize-insecure")
        .arg(format!("--datadir={}", data_dir.to_string_lossy()))
        .arg("--console")
        .output()
        .await
        .map_err(|e| MewAmpError::Installer(e.to_string()))?;

    if !status.status.success() {
        let stderr = String::from_utf8_lossy(&status.stderr);
        let stdout = String::from_utf8_lossy(&status.stdout);

        // MariaDB Windows builds may not support --initialize-insecure on mysqld.
        // Fallback to installer bootstrap executables when available.
        let unknown_init_option = stderr.contains("unknown option '--initialize-insecure'");
        if unknown_init_option {
            let bin_dir = mysqld_path
                .parent()
                .ok_or_else(|| MewAmpError::Installer("mariadb bin dir not found".to_string()))?;
            let candidates = ["mariadb-install-db.exe", "mysql_install_db.exe"];

            for exe in candidates {
                let installer_path = bin_dir.join(exe);
                if !installer_path.exists() {
                    continue;
                }

                let basedir = mysqld_path
                    .parent()
                    .and_then(|p| p.parent())
                    .map(|p| p.to_string_lossy().to_string())
                    .unwrap_or_default();

                let variants = vec![
                    vec![format!("--datadir={}", data_dir.to_string_lossy())],
                    vec![
                        format!("--basedir={basedir}"),
                        format!("--datadir={}", data_dir.to_string_lossy()),
                    ],
                ];

                for args in variants {
                    clear_dir_contents(data_dir).await?;
                    let fallback = Command::new(&installer_path)
                        .args(&args)
                        .output()
                        .await
                        .map_err(|e| MewAmpError::Installer(e.to_string()))?;

                    if fallback.status.success() {
                        return Ok(());
                    }
                }

                clear_dir_contents(data_dir).await?;
                let fallback = Command::new(&installer_path)
                    .arg(format!("--datadir={}", data_dir.to_string_lossy()))
                    .output()
                    .await
                    .map_err(|e| MewAmpError::Installer(e.to_string()))?;
                let fb_stderr = String::from_utf8_lossy(&fallback.stderr);
                let fb_stdout = String::from_utf8_lossy(&fallback.stdout);
                return Err(MewAmpError::Installer(format!(
                    "MariaDB init fallback failed with {}. stdout: {} stderr: {}",
                    exe,
                    fb_stdout.trim(),
                    fb_stderr.trim()
                )));
            }
        }

        return Err(MewAmpError::Installer(
            format!(
                "MariaDB initialization failed. stdout: {} stderr: {}",
                stdout.trim(),
                stderr.trim()
            ),
        ));
    }

    Ok(())
}
