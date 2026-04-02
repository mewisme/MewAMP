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
    #[serde(default)]
    pub product_code: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PlatformPackages {
    pub apache: PackageDefinition,
    pub php: PackageDefinition,
    pub mariadb: PackageDefinition,
    pub phpmyadmin: PackageDefinition,
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
            pkg.map(|p| {
                let release_year = key
                    .strip_prefix("sqllocaldb")
                    .filter(|s| !s.is_empty())
                    .unwrap_or(key)
                    .to_string();
                SqlLocalDbManifestPackage {
                    manifest_key: key.to_string(),
                    release_year,
                    version: p.version.clone(),
                    sha256: p.sha256.clone(),
                    primary_url: p.primary_url.clone(),
                    install_notes: p.install_notes.clone(),
                    product_code: p.product_code.clone(),
                }
            })
        })
        .collect();
        entries.sort_by(|a, b| {
            let av = a.release_year.parse::<u32>().ok();
            let bv = b.release_year.parse::<u32>().ok();
            match (av, bv) {
                (Some(x), Some(y)) => y.cmp(&x),
                _ => b.release_year.cmp(&a.release_year),
            }
        });
        entries
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SqlLocalDbManifestPackage {
    pub manifest_key: String,
    pub release_year: String,
    pub version: String,
    pub sha256: String,
    pub primary_url: String,
    pub install_notes: Option<String>,
    pub product_code: Option<String>,
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
