# MewAMP

A modern, open-source local web development stack manager. Install, configure, and control Apache, PHP, MariaDB, and optional modules like SqlLocalDB — all from a single desktop app.

Built with **Tauri v2** and **React 19**.

## Why MewAMP?

Traditional AMP stacks ship as CLI-heavy bundles with manual config editing. MewAMP wraps the same power in a polished desktop UI with a guided setup wizard, real-time service controls, live log streaming, and built-in diagnostics — so you spend less time wrangling configs and more time building.

## Features

- **Dashboard** — Start, stop, and restart Apache and MariaDB with one click. Quick-action buttons open localhost, phpMyAdmin, htdocs, runtime/config folders, and logs.
- **Setup Wizard** — Two-track guided install: *Core* (paths, ports, components, manifest) and *Modules* (SqlLocalDB and future add-ons). Configurable ports and directories, optional phpMyAdmin, force-reinstall toggle.
- **SqlLocalDB** *(Windows)* — Install, create/delete instances, start/stop, and inspect Microsoft SQL Express LocalDB directly from the dashboard and settings.
- **Live Logs** — Tabbed log viewer for the app, installer, Apache, MariaDB, and SqlLocalDB with 1-second auto-refresh, copy, and clear.
- **Settings** — Manifest summary, path overview, theme selector (light / dark / system), port validation, and full SqlLocalDB instance management.
- **Diagnostics** — Collect runtime state as JSON, copy to clipboard, or export a support bundle.
- **Auto-Updater** — Checks for new releases hourly and installs updates in-app with a progress bar.
- **Custom Titlebar** — Native-feeling window controls on both Windows and macOS.
- **Splash Screen** — Branded loading screen while the app initialises.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Desktop runtime | Tauri v2 (Rust) |
| Frontend | React 19, TypeScript, Vite 6 |
| UI | Tailwind CSS v4, shadcn/ui, Lucide icons |
| State | Jotai |
| Routing | React Router v7 |

## Prerequisites

- [Node.js](https://nodejs.org/) (LTS)
- [pnpm](https://pnpm.io/)
- [Rust](https://www.rust-lang.org/)
- Tauri v2 system dependencies — see [Tauri prerequisites](https://tauri.app/start/prerequisites/)

## Quick Start

```bash
git clone https://github.com/mewisme/MewAMP
cd MewAMP
pnpm install
pnpm app-dev
```

## Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Vite dev server (web only) |
| `pnpm build` | Type-check and build frontend |
| `pnpm preview` | Preview production web build |
| `pnpm app-dev` | Run the Tauri desktop app in development |
| `pnpm app-build` | Build production desktop binaries |
| `pnpm tauri` | Run raw Tauri CLI commands |
| `pnpm icon` | Generate app icons from `app-icon.png` |
| `pnpm app-upver` | Bump version and generate changelog |
| `pnpm app-sign` | Generate updater signing key pair |
| `pnpm rename` | Rename app across config files |

## Project Structure

```text
MewAMP/
├── src/                              # React frontend
│   ├── components/                   # Shared UI (shadcn/ui, layout, sidebar)
│   ├── features/
│   │   ├── dashboard/                # Service cards, quick actions
│   │   ├── setup/                    # Core & modules setup wizards
│   │   ├── logs/                     # Tabbed live log viewer
│   │   ├── settings/                 # Appearance, ports, paths, SqlLocalDB
│   │   ├── diagnostics/              # Runtime diagnostics panel
│   │   ├── sql-localdb/              # SqlLocalDB hooks & global sync
│   │   ├── titlebar/                 # Custom window titlebar (Win/Mac)
│   │   └── updater/                  # In-app version check & update
│   ├── pages/                        # Route pages
│   ├── stores/                       # Jotai atoms (services, setup, app state)
│   ├── hooks/                        # Custom React hooks
│   └── lib/                          # Utilities and Tauri command wrappers
├── src-tauri/                        # Rust backend
│   ├── src/
│   │   ├── commands/                 # Tauri command modules
│   │   ├── installer/                # Installer flow internals
│   │   ├── process_manager/          # Managed process state & control
│   │   ├── diagnostics/              # Diagnostics collection & export
│   │   ├── logs/                     # Log file operations
│   │   └── manifest/                 # Manifest & metadata handling
│   ├── resources/manifest.json       # Bundled runtime manifest
│   ├── Cargo.toml
│   └── tauri.conf.json
├── scripts/                          # Version bump, changelog, rename
└── package.json
```

## Build for Production

```bash
pnpm app-build
```

Desktop installers and binaries are generated under `src-tauri/target/release/bundle`.

## License

[MIT](LICENSE)
