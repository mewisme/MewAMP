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
    /// SQL Server Express LocalDB MSI keyed as `sqllocaldb{year}` in the manifest (e.g. `sqllocaldb2022`).
    #[serde(default)]
    pub sqllocaldb2022: Option<PackageDefinition>,
    #[serde(default)]
    pub sqllocaldb2019: Option<PackageDefinition>,
    #[serde(default)]
    pub sqllocaldb2017: Option<PackageDefinition>,
    #[serde(default)]
    pub sqllocaldb2016: Option<PackageDefinition>,
}

impl PlatformPackages {
    /// Collect SqlLocalDB package entries from the manifest (keys + definitions), sorted by version descending.
    pub fn sql_localdb_entries(&self) -> Vec<SqlLocalDbManifestPackage> {
        let mut entries: Vec<SqlLocalDbManifestPackage> = [
            (
                "sqllocaldb2022",
                self.sqllocaldb2022.as_ref(),
            ),
            ("sqllocaldb2019", self.sqllocaldb2019.as_ref()),
            ("sqllocaldb2017", self.sqllocaldb2017.as_ref()),
            ("sqllocaldb2016", self.sqllocaldb2016.as_ref()),
        ]
        .into_iter()
        .filter_map(|(key, pkg)| {
            pkg.map(|p| SqlLocalDbManifestPackage {
                manifest_key: key.to_string(),
                version: p.version.clone(),
                sha256: p.sha256.clone(),
                primary_url: p.primary_url.clone(),
                install_notes: p.install_notes.clone(),
            })
        })
        .collect();
        entries.sort_by(|a, b| {
            // Numeric year compare when both are digits; fallback to string.
            let av = a.version.parse::<u32>().ok();
            let bv = b.version.parse::<u32>().ok();
            match (av, bv) {
                (Some(x), Some(y)) => y.cmp(&x),
                _ => b.version.cmp(&a.version),
            }
        });
        entries
    }
}

/// Serializable manifest slice for SqlLocalDB (used by setup UI via Tauri command).
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SqlLocalDbManifestPackage {
    pub manifest_key: String,
    pub version: String,
    pub sha256: String,
    pub primary_url: String,
    pub install_notes: Option<String>,
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
