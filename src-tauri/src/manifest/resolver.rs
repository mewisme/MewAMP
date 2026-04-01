use std::{fs, path::PathBuf};

use reqwest::Client;

use crate::{
    error::MewAmpError,
    manifest::schema::RuntimeManifest,
    state::{app_root_dir, load_state, save_state},
};

const REMOTE_MANIFEST_URL: &str =
    "https://github.com/mewisme/MewAMP/releases/latest/download/manifest.json";

#[derive(Debug, Clone, serde::Serialize)]
pub struct ResolvedManifest {
    pub source: String,
    pub manifest: RuntimeManifest,
}

fn manifest_snapshot_path() -> Result<PathBuf, MewAmpError> {
    let mut path = app_root_dir()?;
    path.push("app");
    path.push("state");
    fs::create_dir_all(&path)?;
    path.push("manifest.json");
    Ok(path)
}

pub fn load_builtin_manifest() -> Result<RuntimeManifest, MewAmpError> {
    let content = include_str!("../../resources/manifest.json");
    serde_json::from_str(content).map_err(|e| MewAmpError::Manifest(e.to_string()))
}

fn validate_manifest(manifest: &RuntimeManifest) -> Result<(), MewAmpError> {
    if manifest.schema_version != 1 {
        return Err(MewAmpError::Manifest("unsupported schema version".into()));
    }
    if !manifest.packages.contains_key("windows-x64") {
        return Err(MewAmpError::Manifest("missing windows-x64 packages".into()));
    }
    Ok(())
}

pub async fn resolve_manifest() -> Result<ResolvedManifest, MewAmpError> {
    let builtin = load_builtin_manifest()?;
    validate_manifest(&builtin)?;

    let client = Client::builder()
        .timeout(std::time::Duration::from_secs(5))
        .build()
        .map_err(|e| MewAmpError::Manifest(e.to_string()))?;

    let mut selected = ResolvedManifest {
        source: "builtin".into(),
        manifest: builtin.clone(),
    };

    if let Ok(resp) = client.get(REMOTE_MANIFEST_URL).send().await {
        if resp.status().is_success() {
            if let Ok(text) = resp.text().await {
                if let Ok(remote) = serde_json::from_str::<RuntimeManifest>(&text) {
                    if validate_manifest(&remote).is_ok()
                        && remote.manifest_version >= builtin.manifest_version
                    {
                        selected = ResolvedManifest {
                            source: "remote".into(),
                            manifest: remote,
                        };
                    }
                }
            }
        }
    }

    let snapshot_path = manifest_snapshot_path()?;
    let snapshot = serde_json::to_string_pretty(&selected.manifest)
        .map_err(|e| MewAmpError::Manifest(e.to_string()))?;
    fs::write(&snapshot_path, snapshot)?;

    let mut state = load_state()?;
    state.selected_manifest_source = selected.source.clone();
    state.selected_manifest_version = selected.manifest.manifest_version.clone();
    state.manifest_snapshot_path = Some(snapshot_path.to_string_lossy().to_string());
    save_state(&state)?;

    Ok(selected)
}
