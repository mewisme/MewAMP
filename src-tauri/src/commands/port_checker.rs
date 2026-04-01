use crate::port_checker::{check_ports as check_ports_impl, PortStatus};

#[tauri::command]
pub fn check_ports(ports: Vec<u16>) -> Vec<PortStatus> {
    check_ports_impl(&ports)
}
