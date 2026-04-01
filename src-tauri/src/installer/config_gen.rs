use std::{fs, path::Path};

use crate::error::MewAmpError;

pub fn write_apache_config(
    config_dir: &Path,
    runtime_dir: &Path,
    http_port: u16,
    https_port: u16,
) -> Result<(), MewAmpError> {
    fs::create_dir_all(config_dir)?;
    let modules_dir = runtime_dir.join("modules").to_string_lossy().replace('\\', "/");
    let modules_path = runtime_dir.join("modules");
    let htdocs_dir = runtime_dir.join("htdocs");
    fs::create_dir_all(&htdocs_dir)?;
    let htdocs = htdocs_dir.to_string_lossy().replace('\\', "/");
    let bin_dir = runtime_dir.join("bin");
    let mut optional_load_files = String::new();
    let preload_dlls = [
        "libhttpd.dll",
        "libapr-1.dll",
        "libapriconv-1.dll",
        "libaprutil-1.dll",
        "zlib1.dll",
        "pcre2-8.dll",
        "libcrypto-3-x64.dll",
        "libssl-3-x64.dll",
    ];
    for dll in preload_dlls {
        let path = bin_dir.join(dll);
        if path.exists() {
            optional_load_files.push_str(&format!(
                "LoadFile \"{}\"\n",
                path.to_string_lossy().replace('\\', "/")
            ));
        }
    }
    let mut mpm_load_line = String::new();
    let mpm_candidates = [
        ("mpm_winnt_module", "mod_mpm_winnt.so"),
        ("mpm_event_module", "mod_mpm_event.so"),
        ("mpm_worker_module", "mod_mpm_worker.so"),
        ("mpm_prefork_module", "mod_mpm_prefork.so"),
    ];
    for (module_name, file_name) in mpm_candidates {
        let mpm_path = modules_path.join(file_name);
        if mpm_path.exists() {
            mpm_load_line = format!(
                "LoadModule {module_name} \"{}\"\n",
                mpm_path.to_string_lossy().replace('\\', "/")
            );
            break;
        }
    }

    let content = format!(
        r#"
ServerRoot "{runtime}"
Listen {http}
{load_files}{mpm_line}LoadModule actions_module "{modules}/mod_actions.so"
LoadModule alias_module "{modules}/mod_alias.so"
LoadModule authz_core_module "{modules}/mod_authz_core.so"
LoadModule authz_host_module "{modules}/mod_authz_host.so"
LoadModule dir_module "{modules}/mod_dir.so"
LoadModule mime_module "{modules}/mod_mime.so"
LoadModule rewrite_module "{modules}/mod_rewrite.so"
LoadModule proxy_module "{modules}/mod_proxy.so"
LoadModule proxy_fcgi_module "{modules}/mod_proxy_fcgi.so"
DocumentRoot "{htdocs}"
<Directory "{htdocs}">
  AllowOverride All
  Require all granted
</Directory>
AddHandler application/x-httpd-php .php
<FilesMatch \.php$>
  SetHandler "proxy:fcgi://127.0.0.1:9000"
</FilesMatch>
ServerName 127.0.0.1:{http}
Define SSL_PORT {https}
"#,
        runtime = runtime_dir.to_string_lossy().replace('\\', "/"),
        load_files = optional_load_files,
        mpm_line = mpm_load_line,
        modules = modules_dir,
        htdocs = htdocs,
        http = http_port,
        https = https_port
    );
    fs::write(config_dir.join("httpd.conf"), content)?;
    Ok(())
}

pub fn write_php_config(config_dir: &Path) -> Result<(), MewAmpError> {
    fs::create_dir_all(config_dir)?;
    fs::write(config_dir.join("php.ini"), "date.timezone=UTC\n")?;
    Ok(())
}

pub fn write_mariadb_config(config_dir: &Path, port: u16, data_dir: &Path) -> Result<(), MewAmpError> {
    fs::create_dir_all(config_dir)?;
    let content = format!(
        "[mysqld]\nport={port}\ndatadir={}\n",
        data_dir.to_string_lossy().replace('\\', "/")
    );
    fs::write(config_dir.join("my.ini"), content)?;
    Ok(())
}
