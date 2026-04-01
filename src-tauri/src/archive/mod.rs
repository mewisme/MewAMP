use std::{
    fs::{self, File},
    io,
    path::Path,
};
use zip::ZipArchive;

use crate::error::MewAmpError;

pub fn extract_zip(archive_path: &Path, target_dir: &Path) -> Result<(), MewAmpError> {
    fs::create_dir_all(target_dir)?;
    let file = File::open(archive_path)?;
    let mut archive = ZipArchive::new(file).map_err(|e| MewAmpError::Archive(e.to_string()))?;

    for i in 0..archive.len() {
        let mut entry = archive
            .by_index(i)
            .map_err(|e| MewAmpError::Archive(e.to_string()))?;
        let outpath = target_dir.join(entry.mangled_name());

        if entry.name().ends_with('/') {
            fs::create_dir_all(&outpath)?;
            continue;
        }

        if let Some(parent) = outpath.parent() {
            fs::create_dir_all(parent)?;
        }

        let mut outfile = File::create(&outpath)?;
        io::copy(&mut entry, &mut outfile).map_err(|e| MewAmpError::Archive(e.to_string()))?;
    }

    Ok(())
}
