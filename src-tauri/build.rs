fn main() {
    let mut attrs = tauri_build::Attributes::new();

    // Embed a Windows app manifest for the *build target* (not the host): UAC + Common Controls v6.
    // `#[cfg(windows)]` would wrong when cross-compiling from macOS/Linux to Windows.
    if std::env::var("CARGO_CFG_TARGET_OS").as_deref() == Ok("windows") {
        let windows = tauri_build::WindowsAttributes::new().app_manifest(
            r#"<assembly xmlns="urn:schemas-microsoft-com:asm.v1" manifestVersion="1.0">
  <dependency>
    <dependentAssembly>
      <assemblyIdentity
        type="win32"
        name="Microsoft.Windows.Common-Controls"
        version="6.0.0.0"
        processorArchitecture="*"
        publicKeyToken="6595b64144ccf1df"
        language="*"
      />
    </dependentAssembly>
  </dependency>
  <trustInfo xmlns="urn:schemas-microsoft-com:asm.v3">
    <security>
      <requestedPrivileges>
        <requestedExecutionLevel level="requireAdministrator" uiAccess="false" />
      </requestedPrivileges>
    </security>
  </trustInfo>
</assembly>"#,
        );
        attrs = attrs.windows_attributes(windows);
    }

    if let Err(error) = tauri_build::try_build(attrs) {
        let error = format!("{error:#}");
        eprintln!("{error}");
        if error.starts_with("unknown field") {
            eprint!(
                "found an unknown configuration field. This usually means that you are using a CLI version that is newer than `tauri-build` and is incompatible. "
            );
            eprintln!(
                "Please try updating the Rust crates by running `cargo update` in the Tauri app folder."
            );
        }
        std::process::exit(1);
    }
}
