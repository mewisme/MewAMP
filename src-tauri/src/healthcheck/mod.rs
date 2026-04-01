use std::{net::TcpStream, time::Duration};

use crate::error::MewAmpError;

pub async fn check_http(url: &str) -> Result<bool, MewAmpError> {
    let client = reqwest::Client::builder()
        .timeout(Duration::from_secs(3))
        .build()
        .map_err(|e| MewAmpError::Health(e.to_string()))?;
    let response = client
        .get(url)
        .send()
        .await
        .map_err(|e| MewAmpError::Health(e.to_string()))?;
    Ok(response.status().is_success())
}

pub fn check_tcp_local(port: u16) -> bool {
    TcpStream::connect_timeout(
        &format!("127.0.0.1:{port}")
            .parse()
            .expect("valid socket address"),
        Duration::from_secs(2),
    )
    .is_ok()
}
