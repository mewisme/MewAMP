use tauri::{AppHandle, Manager};

/// `show_main`: when `Some(false)`, only close splash window and keep main hidden.
/// Omit or pass `None` to also show main window after splash closes.
#[tauri::command]
pub fn splash_close(app: AppHandle, show_main: Option<bool>) {
    let show_main = show_main.unwrap_or(true);

    if let Some(splash) = app.get_webview_window("splashscreen") {
        let _ = splash.close();
    }

    if let Some(main) = app.get_webview_window("main") {
        if show_main {
            let _ = main.show();
            let _ = main.set_focus();
        }
    }
}
