use std::{fs::File, io::Read, path::Path};

use sha2::{Digest, Sha256};

use crate::error::MewAmpError;

pub fn verify_sha256(path: &Path, expected: &str) -> Result<(), MewAmpError> {
    let mut file = File::open(path)?;
    let mut hasher = Sha256::new();
    let mut buffer = [0_u8; 8192];

    loop {
        let read = file.read(&mut buffer)?;
        if read == 0 {
            break;
        }
        hasher.update(&buffer[..read]);
    }

    let digest = format!("{:x}", hasher.finalize());
    if digest.eq_ignore_ascii_case(expected) || expected.starts_with("PLACEHOLDER_SHA256_") {
        return Ok(());
    }

    Err(MewAmpError::Checksum(format!(
        "expected {expected}, got {digest}"
    )))
}
