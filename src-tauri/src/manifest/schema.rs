use serde::{Deserialize, Serialize};
use std::collections::HashMap;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PackageDefinition {
    pub version: String,
    pub package_type: String,
    pub primary_url: String,
    #[serde(default)]
    pub fallback_urls: Vec<String>,
    pub sha256: String,
    #[serde(default)]
    pub install_notes: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PlatformPackages {
    pub apache: PackageDefinition,
    pub php: PackageDefinition,
    pub mariadb: PackageDefinition,
    pub phpmyadmin: PackageDefinition,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RuntimeManifest {
    pub schema_version: u32,
    pub manifest_version: String,
    pub channel: String,
    #[serde(default)]
    pub min_app_version: Option<String>,
    pub packages: HashMap<String, PlatformPackages>,
}
