use std::{fs, path::PathBuf};

use crate::{error::MewAmpError, state::app_root_dir};

pub fn logs_dir() -> Result<PathBuf, MewAmpError> {
    let mut path = app_root_dir()?;
    path.push("app");
    path.push("logs");
    fs::create_dir_all(&path)?;
    Ok(path)
}

fn log_path(kind: &str) -> Result<PathBuf, MewAmpError> {
    let filename = match kind {
        "installer" => "installer.log",
        "apache" => "apache.log",
        "mariadb" => "mariadb.log",
        "sqllocaldb" => "sqllocaldb.log",
        _ => "app.log",
    };
    Ok(logs_dir()?.join(filename))
}

pub fn append_log(kind: &str, message: &str) -> Result<(), MewAmpError> {
    let path = log_path(kind)?;
    let timestamp = chrono::Utc::now().to_rfc3339();
    let line = format!("[{timestamp}] {message}\n");
    use std::io::Write;
    let mut file = fs::OpenOptions::new()
        .create(true)
        .append(true)
        .open(path)?;
    file.write_all(line.as_bytes())?;
    Ok(())
}

pub fn read_log(kind: &str) -> Result<String, MewAmpError> {
    let path = log_path(kind)?;
    if !path.exists() {
        return Ok(String::new());
    }
    fs::read_to_string(path).map_err(Into::into)
}

pub fn clear_log(kind: &str) -> Result<(), MewAmpError> {
    let path = log_path(kind)?;
    if path.exists() {
        fs::write(path, "")?;
    } else {
        fs::File::create(path)?;
    }
    Ok(())
}
