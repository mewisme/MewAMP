use serde::Serialize;

#[derive(Debug, thiserror::Error)]
pub enum MewAmpError {
    #[error("io error: {0}")]
    Io(String),
    #[error("manifest error: {0}")]
    Manifest(String),
    #[error("download error: {0}")]
    Download(String),
    #[error("checksum mismatch: {0}")]
    Checksum(String),
    #[error("archive error: {0}")]
    Archive(String),
    #[error("installer error: {0}")]
    Installer(String),
    #[error("process error: {0}")]
    Process(String),
    #[error("healthcheck error: {0}")]
    Health(String),
    #[error("state error: {0}")]
    State(String),
}

impl From<std::io::Error> for MewAmpError {
    fn from(value: std::io::Error) -> Self {
        Self::Io(value.to_string())
    }
}

#[derive(Debug, Serialize)]
pub struct ErrorPayload {
    pub message: String,
}

impl From<MewAmpError> for ErrorPayload {
    fn from(value: MewAmpError) -> Self {
        Self {
            message: value.to_string(),
        }
    }
}
