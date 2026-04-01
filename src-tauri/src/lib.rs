// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
use std::sync::Mutex;
use tauri::{
    menu::{MenuBuilder, MenuItemBuilder},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    Emitter, Manager,
};

// Global state to store the opened file path
struct OpenedFilePath(Mutex<Option<String>>);

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[tauri::command]
fn get_opened_file_path(state: tauri::State<OpenedFilePath>) -> Option<String> {
    state.0.lock().unwrap().clone()
}

#[tauri::command]
fn toggle_devtools(app: tauri::AppHandle) {
    if let Some(window) = app.get_webview_window("main") {
        if window.is_devtools_open() {
            let _ = window.close_devtools();
        } else {
            let _ = window.open_devtools();
        }
    }
}

#[tauri::command]
fn open_devtools(app: tauri::AppHandle) {
    if let Some(window) = app.get_webview_window("main") {
        let _ = window.open_devtools();
    }
}

#[tauri::command]
fn close_devtools(app: tauri::AppHandle) {
    if let Some(window) = app.get_webview_window("main") {
        let _ = window.close_devtools();
    }
}

mod commands;
mod error;
mod state;
mod manifest;
mod downloader;
mod checksum;
mod archive;
mod installer;
mod process_manager;
mod port_checker;
mod healthcheck;
mod diagnostics;
mod logs;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_clipboard_manager::init())
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_http::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_os::init())
        .manage(process_manager::ServiceManager::new())
        .setup(|app| {
            // Capture CLI arguments to check if a file was opened
            let args: Vec<String> = std::env::args().collect();
            let opened_file = if args.len() > 1 {
                // The file path is typically the second argument (first is the executable)
                let file_path = args[1].clone();
                // Check if it's a .ts or .tsx file
                if file_path.ends_with(".ts") || file_path.ends_with(".tsx") {
                    Some(file_path.clone())
                } else {
                    None
                }
            } else {
                None
            };

            // Store the opened file path in app state
            app.manage(OpenedFilePath(Mutex::new(opened_file.clone())));

            // Emit event to frontend if a file was opened
            if let Some(file_path) = opened_file {
                let window = app
                    .get_webview_window("main")
                    .expect("Failed to get main window");
                let _ = window.emit("file-opened", file_path);
            }

            // Register cleanup handler for when the app is closing
            let window = app
                .get_webview_window("main")
                .expect("Failed to get main window");
            let main_window = window.clone();
            window.on_window_event(
                move |event| {
                    if let tauri::WindowEvent::CloseRequested { api, .. } = event {
                        api.prevent_close();
                        let _ = main_window.hide();
                    }
                },
            );

            let show_item = MenuItemBuilder::with_id("show", "Show MewAMP").build(app)?;
            let quit_item = MenuItemBuilder::with_id("quit", "Quit").build(app)?;
            let tray_menu = MenuBuilder::new(app)
                .items(&[&show_item, &quit_item])
                .build()?;

            let app_handle = app.handle().clone();
            TrayIconBuilder::with_id("mewamp-tray")
                .icon(
                    app.default_window_icon()
                        .cloned()
                        .expect("missing default window icon"),
                )
                .menu(&tray_menu)
                .show_menu_on_left_click(false)
                .on_menu_event(move |_, event| match event.id.as_ref() {
                    "show" => {
                        if let Some(main) = app_handle.get_webview_window("main") {
                            let _ = main.show();
                            let _ = main.set_focus();
                        }
                    }
                    "quit" => {
                        app_handle.exit(0);
                    }
                    _ => {}
                })
                .on_tray_icon_event(move |tray: &tauri::tray::TrayIcon, event| {
                    if let TrayIconEvent::Click {
                        button: MouseButton::Left,
                        button_state: MouseButtonState::Up,
                        ..
                    } = event
                    {
                        if let Some(main) = tray.app_handle().get_webview_window("main") {
                            let visible = main.is_visible().unwrap_or(false);
                            if visible {
                                let _ = main.hide();
                            } else {
                                let _ = main.show();
                                let _ = main.set_focus();
                            }
                        }
                    }
                })
                .build(app)?;
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            greet,
            get_opened_file_path,
            toggle_devtools,
            open_devtools,
            close_devtools,
            commands::splash::splash_close,
            commands::files::list_dir,
            commands::files::read_file_content,
            commands::files::write_file_content,
            commands::files::create_directory,
            commands::files::create_file,
            commands::files::delete_node,
            commands::files::rename_node,
            commands::git::get_current_branch,
            commands::git::get_all_branches,
            commands::git::switch_branch,
            commands::git::get_git_status,
            commands::git::git_pull,
            commands::installer::start_install,
            commands::installer::get_install_state,
            commands::installer::reset_install_state,
            commands::services::start_service,
            commands::services::start_managed_service,
            commands::services::stop_service,
            commands::services::get_service_status,
            commands::port_checker::check_ports,
            commands::diagnostics::get_diagnostics,
            commands::diagnostics::export_diagnostics,
            commands::logs::get_log,
            commands::logs::clear_log_file,
            commands::settings::get_app_settings,
            commands::settings::get_htdocs_path,
            commands::settings::open_folder,
            commands::settings::update_ports,
            commands::settings::update_paths,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
