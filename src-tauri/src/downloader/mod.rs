use std::{fs::File, io::Write, path::Path};

use tauri::Emitter;

use crate::error::MewAmpError;

pub async fn download_with_progress(
    app: &tauri::AppHandle,
    url: &str,
    output_path: &Path,
    event_prefix: &str,
) -> Result<(), MewAmpError> {
    let client = reqwest::Client::new();
    let response = client
        .get(url)
        .send()
        .await
        .map_err(|e| MewAmpError::Download(e.to_string()))?;
    let total_size = response.content_length().unwrap_or(0);
    let mut downloaded: u64 = 0;
    let mut file = File::create(output_path)?;

    let bytes = response
        .bytes()
        .await
        .map_err(|e| MewAmpError::Download(e.to_string()))?;
    file.write_all(&bytes)?;
    downloaded += bytes.len() as u64;

    let event_name = format!("{event_prefix}:progress");
    let _ = app.emit(
        &event_name,
        serde_json::json!({
          "downloaded": downloaded,
          "total": total_size
        }),
    );

    Ok(())
}
