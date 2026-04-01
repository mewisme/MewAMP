use serde::Serialize;
use std::net::TcpListener;

#[derive(Debug, Clone, Serialize)]
pub struct PortStatus {
    pub port: u16,
    pub available: bool,
}

pub fn check_port(port: u16) -> bool {
    TcpListener::bind(("127.0.0.1", port)).is_ok()
}

pub fn check_ports(ports: &[u16]) -> Vec<PortStatus> {
    ports
        .iter()
        .map(|port| PortStatus {
            port: *port,
            available: check_port(*port),
        })
        .collect()
}
