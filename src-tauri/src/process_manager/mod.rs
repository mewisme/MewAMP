use std::{collections::HashMap, env, path::Path, process::Stdio, sync::Mutex};

use tokio::io::{AsyncBufReadExt, BufReader};
use tokio::process::{Child, Command};
use tokio::time::{sleep, Duration};

use crate::{error::MewAmpError, logs::append_log};

#[cfg(target_os = "windows")]
const CREATE_NO_WINDOW: u32 = 0x08000000;

pub struct ServiceManager {
    children: Mutex<HashMap<String, Child>>,
}

impl ServiceManager {
    pub fn new() -> Self {
        Self {
            children: Mutex::new(HashMap::new()),
        }
    }

    pub async fn start(
        &self,
        name: &str,
        bin: &str,
        args: &[String],
        cwd: &str,
    ) -> Result<(), MewAmpError> {
        let mut cmd = Command::new(bin);
        let existing_path = env::var("PATH").unwrap_or_default();
        let bin_parent = Path::new(bin)
            .parent()
            .map(|p| p.to_string_lossy().to_string())
            .unwrap_or_default();
        let merged_path = if bin_parent.is_empty() {
            existing_path
        } else {
            format!("{bin_parent};{existing_path}")
        };
        cmd.args(args)
            .current_dir(cwd)
            .env("PATH", merged_path)
            .stdin(Stdio::null())
            .stdout(Stdio::piped())
            .stderr(Stdio::piped());
        #[cfg(target_os = "windows")]
        cmd.creation_flags(CREATE_NO_WINDOW);

        let mut child = cmd
            .spawn()
            .map_err(|e| MewAmpError::Process(format!("failed to start {name}: {e}")))?;

        if let Some(stdout) = child.stdout.take() {
            let stream_name = name.to_string();
            tokio::spawn(async move {
                let mut lines = BufReader::new(stdout).lines();
                while let Ok(Some(line)) = lines.next_line().await {
                    let _ = append_log(&stream_name, &line);
                }
            });
        }

        if let Some(stderr) = child.stderr.take() {
            let stream_name = name.to_string();
            tokio::spawn(async move {
                let mut lines = BufReader::new(stderr).lines();
                while let Ok(Some(line)) = lines.next_line().await {
                    let _ = append_log(&stream_name, &line);
                }
            });
        }

        // Detect immediate startup crashes and report a real error to UI.
        sleep(Duration::from_millis(700)).await;
        if let Some(status) = child
            .try_wait()
            .map_err(|e| MewAmpError::Process(format!("failed to inspect {name} status: {e}")))?
        {
            return Err(MewAmpError::Process(format!(
                "{name} exited right after startup (code: {:?})",
                status.code()
            )));
        }

        self.children
            .lock()
            .map_err(|e| MewAmpError::Process(e.to_string()))?
            .insert(name.to_string(), child);
        let _ = append_log("app", &format!("{name} process started"));
        Ok(())
    }

    pub async fn stop(&self, name: &str) -> Result<(), MewAmpError> {
        let maybe_child = self
            .children
            .lock()
            .map_err(|e| MewAmpError::Process(e.to_string()))?
            .remove(name);

        if let Some(mut child) = maybe_child {
            child
                .kill()
                .await
                .map_err(|e| MewAmpError::Process(format!("failed to stop {name}: {e}")))?;
            let _ = append_log("app", &format!("{name} process stopped"));
        }
        Ok(())
    }

    pub fn status(&self, name: &str) -> String {
        let mut children = match self.children.lock() {
            Ok(guard) => guard,
            Err(_) => return "error".into(),
        };

        if let Some(child) = children.get_mut(name) {
            match child.try_wait() {
                Ok(Some(_)) => {
                    children.remove(name);
                    "stopped".into()
                }
                Ok(None) => "running".into(),
                Err(_) => "error".into(),
            }
        } else {
            "stopped".into()
        }
    }
}
