# MewAMP

MewAMP is a desktop application built with Tauri + React for managing local development services with a modern dashboard, guided setup flow, diagnostics, and log tooling.

## Features

- Cross-platform desktop runtime with Tauri v2
- Dashboard and setup pages for installer and service workflows
- Service control and status monitoring via Rust commands
- Port checks and diagnostics export
- Log viewing and cleanup utilities
- Settings management for ports and local paths
- Built-in file system and Git helper commands

## Tech Stack

- Frontend: React 19, TypeScript, Vite 6
- UI: Tailwind CSS v4, shadcn/ui, Lucide icons
- State: Jotai
- Routing: React Router v7
- Desktop runtime: Tauri v2
- Backend language: Rust

## Prerequisites

Install these tools before running the app:

- [Node.js](https://nodejs.org/) (LTS recommended)
- [pnpm](https://pnpm.io/)
- [Rust](https://www.rust-lang.org/)
- System requirements for Tauri (see [Tauri prerequisites](https://tauri.app/start/prerequisites/))

## Quick Start

```bash
git clone https://github.com/mewisme/MewAMP
cd MewAMP
pnpm install
pnpm app-dev
```

## Scripts

- `pnpm dev` - Run Vite dev server (web only)
- `pnpm build` - Type-check and build frontend (`tsc && vite build`)
- `pnpm preview` - Preview the production web build
- `pnpm app-dev` - Run the Tauri desktop app in development
- `pnpm app-build` - Build production desktop binaries
- `pnpm tauri` - Run raw Tauri CLI commands
- `pnpm icon` - Generate app icons from `app-icon.png`
- `pnpm app-upver` - Generate changelog and bump app version
- `pnpm app-sign` - Generate updater signing key pair
- `pnpm rename` - Rename app metadata across key config files

## Rename App

```bash
pnpm rename "MewAMP"
```

The rename script updates:

- `package.json` (`name`)
- `src-tauri/Cargo.toml` (`name`, `description`)
- `src-tauri/tauri.conf.json` (`productName`, `identifier`, window title)

## Project Structure

```text
MewAMP/
├── src/                          # React frontend
│   ├── components/               # Shared UI components
│   ├── features/                 # Feature modules (dashboard, setup, logs, etc.)
│   ├── pages/                    # Route pages
│   ├── stores/                   # Jotai stores
│   ├── hooks/                    # Custom hooks
│   └── lib/                      # Frontend utilities and command wrappers
├── src-tauri/                    # Rust + Tauri backend
│   ├── src/commands/             # Tauri command modules
│   ├── src/installer/            # Installer flow internals
│   ├── src/process_manager/      # Managed process state/control
│   ├── src/diagnostics/          # Diagnostics collection/export logic
│   ├── src/logs/                 # Log operations
│   ├── src/manifest/             # Manifest and metadata handling
│   ├── Cargo.toml
│   └── tauri.conf.json
├── public/                       # Static assets
├── scripts/                      # Project maintenance scripts
└── package.json
```

## Tauri Commands (Current)

### Utility

- `greet`
- `get_opened_file_path`
- `toggle_devtools`
- `open_devtools`
- `close_devtools`
- `splash_close`

### File System

- `list_dir`
- `read_file_content`
- `write_file_content`
- `create_directory`
- `create_file`
- `delete_node`
- `rename_node`

### Git

- `get_current_branch`
- `get_all_branches`
- `switch_branch`
- `get_git_status`
- `git_pull`

### Setup / Installer

- `start_install`
- `get_install_state`
- `reset_install_state`

### Services / Runtime

- `start_service`
- `start_managed_service`
- `stop_service`
- `get_service_status`
- `check_ports`

### Diagnostics / Logs / Settings

- `get_diagnostics`
- `export_diagnostics`
- `get_log`
- `clear_log_file`
- `get_app_settings`
- `get_htdocs_path`
- `open_folder`
- `update_ports`
- `update_paths`

## Build for Production

```bash
pnpm build
pnpm app-build
```

Desktop build artifacts are generated under `src-tauri/target/release`.

## License

MIT License. See [LICENSE](LICENSE).
